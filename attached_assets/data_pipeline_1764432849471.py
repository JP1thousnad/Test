"""
Earnings Bot - Data Pipeline
Handles scheduled data ingestion, processing, and storage.
Uses Apache Airflow-style DAG patterns for orchestration.
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
import hashlib
import sqlite3
from pathlib import Path


class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class Task:
    """Represents a pipeline task"""
    task_id: str
    callable: Callable
    args: tuple = field(default_factory=tuple)
    kwargs: dict = field(default_factory=dict)
    dependencies: List[str] = field(default_factory=list)
    retries: int = 3
    retry_delay: int = 60  # seconds
    status: TaskStatus = TaskStatus.PENDING
    result: any = None
    error: str = None
    started_at: datetime = None
    completed_at: datetime = None


@dataclass
class DAGRun:
    """Represents a DAG execution"""
    run_id: str
    dag_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    status: TaskStatus = TaskStatus.PENDING
    tasks: Dict[str, Task] = field(default_factory=dict)


class Pipeline:
    """
    Data pipeline orchestrator.
    Manages task dependencies and execution order.
    """
    
    def __init__(self, dag_id: str):
        self.dag_id = dag_id
        self.tasks: Dict[str, Task] = {}
        self.runs: List[DAGRun] = []
    
    def add_task(self, task_id: str, callable: Callable, 
                 dependencies: List[str] = None, **kwargs) -> 'Pipeline':
        """Add a task to the pipeline"""
        task = Task(
            task_id=task_id,
            callable=callable,
            dependencies=dependencies or [],
            **kwargs
        )
        self.tasks[task_id] = task
        return self
    
    def _get_execution_order(self) -> List[str]:
        """Topological sort for task execution order"""
        visited = set()
        order = []
        
        def visit(task_id: str):
            if task_id in visited:
                return
            visited.add(task_id)
            
            task = self.tasks.get(task_id)
            if task:
                for dep in task.dependencies:
                    visit(dep)
                order.append(task_id)
        
        for task_id in self.tasks:
            visit(task_id)
        
        return order
    
    def run(self, context: Dict = None) -> DAGRun:
        """Execute the pipeline"""
        run_id = f"{self.dag_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        dag_run = DAGRun(
            run_id=run_id,
            dag_id=self.dag_id,
            start_time=datetime.now(),
            tasks={k: Task(**{**v.__dict__}) for k, v in self.tasks.items()}
        )
        
        execution_order = self._get_execution_order()
        context = context or {}
        
        print(f"Starting pipeline: {self.dag_id}")
        print(f"Execution order: {execution_order}")
        
        for task_id in execution_order:
            task = dag_run.tasks[task_id]
            
            # Check dependencies
            deps_success = all(
                dag_run.tasks[dep].status == TaskStatus.SUCCESS 
                for dep in task.dependencies
            )
            
            if not deps_success:
                task.status = TaskStatus.SKIPPED
                print(f"  ⏭ Skipping {task_id} (dependencies not met)")
                continue
            
            # Execute task with retries
            task.status = TaskStatus.RUNNING
            task.started_at = datetime.now()
            
            for attempt in range(task.retries):
                try:
                    print(f"  ▶ Running {task_id} (attempt {attempt + 1}/{task.retries})")
                    result = task.callable(*task.args, context=context, **task.kwargs)
                    task.result = result
                    task.status = TaskStatus.SUCCESS
                    task.completed_at = datetime.now()
                    print(f"  ✓ {task_id} completed successfully")
                    break
                    
                except Exception as e:
                    task.error = str(e)
                    if attempt < task.retries - 1:
                        print(f"  ⚠ {task_id} failed, retrying...")
                    else:
                        task.status = TaskStatus.FAILED
                        task.completed_at = datetime.now()
                        print(f"  ✗ {task_id} failed: {e}")
        
        dag_run.end_time = datetime.now()
        dag_run.status = (
            TaskStatus.SUCCESS 
            if all(t.status in [TaskStatus.SUCCESS, TaskStatus.SKIPPED] 
                   for t in dag_run.tasks.values())
            else TaskStatus.FAILED
        )
        
        self.runs.append(dag_run)
        return dag_run


class DataStore:
    """
    Simple SQLite-based data store for pipeline results.
    In production, replace with PostgreSQL, MongoDB, or cloud storage.
    """
    
    def __init__(self, db_path: str = "earnings_data.db"):
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        """Initialize database tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Earnings data table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS earnings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT NOT NULL,
                period TEXT NOT NULL,
                report_date TEXT,
                data JSON,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(ticker, period)
            )
        """)
        
        # Stock info cache
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stock_info (
                ticker TEXT PRIMARY KEY,
                data JSON,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Transcript analysis results
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transcripts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT NOT NULL,
                period TEXT NOT NULL,
                transcript_hash TEXT,
                sentiment JSON,
                summary TEXT,
                guidance JSON,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Pipeline run history
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pipeline_runs (
                run_id TEXT PRIMARY KEY,
                dag_id TEXT,
                status TEXT,
                start_time TEXT,
                end_time TEXT,
                results JSON
            )
        """)
        
        conn.commit()
        conn.close()
    
    def save_earnings(self, ticker: str, period: str, data: Dict):
        """Save earnings data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO earnings (ticker, period, report_date, data)
            VALUES (?, ?, ?, ?)
        """, (ticker, period, datetime.now().isoformat(), json.dumps(data)))
        
        conn.commit()
        conn.close()
    
    def get_earnings(self, ticker: str, period: str = None) -> List[Dict]:
        """Retrieve earnings data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if period:
            cursor.execute(
                "SELECT * FROM earnings WHERE ticker = ? AND period = ?",
                (ticker, period)
            )
        else:
            cursor.execute(
                "SELECT * FROM earnings WHERE ticker = ? ORDER BY period DESC",
                (ticker,)
            )
        
        results = cursor.fetchall()
        conn.close()
        
        return [
            {
                "id": r[0],
                "ticker": r[1],
                "period": r[2],
                "report_date": r[3],
                "data": json.loads(r[4]) if r[4] else None
            }
            for r in results
        ]
    
    def save_stock_info(self, ticker: str, data: Dict):
        """Cache stock info"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO stock_info (ticker, data, updated_at)
            VALUES (?, ?, ?)
        """, (ticker, json.dumps(data), datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
    
    def get_stock_info(self, ticker: str, max_age_hours: int = 24) -> Optional[Dict]:
        """Get cached stock info if not stale"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT data, updated_at FROM stock_info WHERE ticker = ?",
            (ticker,)
        )
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            updated_at = datetime.fromisoformat(result[1])
            if datetime.now() - updated_at < timedelta(hours=max_age_hours):
                return json.loads(result[0])
        
        return None
    
    def save_pipeline_run(self, dag_run: DAGRun):
        """Save pipeline run history"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        results = {
            task_id: {
                "status": task.status.value,
                "error": task.error,
                "started_at": task.started_at.isoformat() if task.started_at else None,
                "completed_at": task.completed_at.isoformat() if task.completed_at else None
            }
            for task_id, task in dag_run.tasks.items()
        }
        
        cursor.execute("""
            INSERT OR REPLACE INTO pipeline_runs 
            (run_id, dag_id, status, start_time, end_time, results)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            dag_run.run_id,
            dag_run.dag_id,
            dag_run.status.value,
            dag_run.start_time.isoformat(),
            dag_run.end_time.isoformat() if dag_run.end_time else None,
            json.dumps(results)
        ))
        
        conn.commit()
        conn.close()


# Pipeline task functions
def fetch_earnings_task(tickers: List[str], context: Dict = None) -> Dict:
    """Task: Fetch earnings data for multiple tickers"""
    from earnings_bot import EarningsBot
    
    bot = EarningsBot()
    results = {}
    
    for ticker in tickers:
        try:
            income = bot.data_fetcher.get_income_statement(ticker)
            results[ticker] = {
                "status": "success",
                "data": income
            }
        except Exception as e:
            results[ticker] = {
                "status": "error",
                "error": str(e)
            }
    
    return results


def calculate_metrics_task(context: Dict = None) -> Dict:
    """Task: Calculate metrics from fetched data"""
    from earnings_bot import MetricsCalculator
    
    calculator = MetricsCalculator()
    earnings_data = context.get('fetch_earnings', {})
    results = {}
    
    for ticker, data in earnings_data.items():
        if data.get('status') == 'success' and data.get('data'):
            income = data['data'][0] if data['data'] else {}
            margins = calculator.calculate_margins(income)
            results[ticker] = margins
    
    return results


def store_results_task(context: Dict = None) -> Dict:
    """Task: Store results in database"""
    store = DataStore()
    
    earnings_data = context.get('fetch_earnings', {})
    metrics_data = context.get('calculate_metrics', {})
    
    for ticker in earnings_data:
        if earnings_data[ticker].get('status') == 'success':
            combined = {
                "earnings": earnings_data[ticker].get('data'),
                "metrics": metrics_data.get(ticker)
            }
            period = combined['earnings'][0].get('period_ending', 'unknown') if combined['earnings'] else 'unknown'
            store.save_earnings(ticker, period, combined)
    
    return {"stored": list(earnings_data.keys())}


def generate_alerts_task(context: Dict = None) -> List[Dict]:
    """Task: Generate alerts for significant events"""
    alerts = []
    
    metrics_data = context.get('calculate_metrics', {})
    
    for ticker, metrics in metrics_data.items():
        # Alert on low margins
        if metrics.get('net_margin', 100) < 5:
            alerts.append({
                "type": "warning",
                "ticker": ticker,
                "message": f"Low net margin: {metrics['net_margin']}%"
            })
        
        # Alert on high margins
        if metrics.get('net_margin', 0) > 25:
            alerts.append({
                "type": "positive",
                "ticker": ticker,
                "message": f"Strong profitability: {metrics['net_margin']}% net margin"
            })
    
    return alerts


# Pre-built pipeline configurations
def create_daily_pipeline(tickers: List[str]) -> Pipeline:
    """Create a daily earnings data pipeline"""
    pipeline = Pipeline(dag_id="daily_earnings_update")
    
    pipeline.add_task(
        task_id="fetch_earnings",
        callable=fetch_earnings_task,
        args=(tickers,)
    )
    
    pipeline.add_task(
        task_id="calculate_metrics",
        callable=calculate_metrics_task,
        dependencies=["fetch_earnings"]
    )
    
    pipeline.add_task(
        task_id="store_results",
        callable=store_results_task,
        dependencies=["calculate_metrics"]
    )
    
    pipeline.add_task(
        task_id="generate_alerts",
        callable=generate_alerts_task,
        dependencies=["calculate_metrics"]
    )
    
    return pipeline


class Scheduler:
    """
    Simple scheduler for running pipelines.
    In production, use Airflow, Prefect, or Dagster.
    """
    
    def __init__(self):
        self.pipelines: Dict[str, Pipeline] = {}
        self.schedules: Dict[str, Dict] = {}
    
    def register_pipeline(self, pipeline: Pipeline, cron: str = None):
        """Register a pipeline with optional cron schedule"""
        self.pipelines[pipeline.dag_id] = pipeline
        if cron:
            self.schedules[pipeline.dag_id] = {
                "cron": cron,
                "last_run": None
            }
    
    def run_pipeline(self, dag_id: str, context: Dict = None) -> DAGRun:
        """Manually trigger a pipeline"""
        if dag_id not in self.pipelines:
            raise ValueError(f"Pipeline {dag_id} not found")
        
        pipeline = self.pipelines[dag_id]
        run = pipeline.run(context)
        
        # Save run history
        store = DataStore()
        store.save_pipeline_run(run)
        
        return run
    
    def get_run_history(self, dag_id: str = None, limit: int = 10) -> List[Dict]:
        """Get pipeline run history"""
        conn = sqlite3.connect("earnings_data.db")
        cursor = conn.cursor()
        
        if dag_id:
            cursor.execute(
                "SELECT * FROM pipeline_runs WHERE dag_id = ? ORDER BY start_time DESC LIMIT ?",
                (dag_id, limit)
            )
        else:
            cursor.execute(
                "SELECT * FROM pipeline_runs ORDER BY start_time DESC LIMIT ?",
                (limit,)
            )
        
        results = cursor.fetchall()
        conn.close()
        
        return [
            {
                "run_id": r[0],
                "dag_id": r[1],
                "status": r[2],
                "start_time": r[3],
                "end_time": r[4],
                "results": json.loads(r[5]) if r[5] else None
            }
            for r in results
        ]


# Example usage
if __name__ == "__main__":
    print("Data Pipeline - Example Usage")
    print("=" * 50)
    
    # Create and run a pipeline
    watchlist = ["AAPL", "MSFT", "GOOGL"]
    
    pipeline = create_daily_pipeline(watchlist)
    
    print(f"\nPipeline: {pipeline.dag_id}")
    print(f"Tasks: {list(pipeline.tasks.keys())}")
    
    # Run the pipeline
    print("\nExecuting pipeline...")
    context = {}
    
    # Execute tasks and collect results into context
    for task_id in pipeline._get_execution_order():
        task = pipeline.tasks[task_id]
        try:
            result = task.callable(*task.args, context=context, **task.kwargs)
            context[task_id] = result
            print(f"  ✓ {task_id}: {type(result)}")
        except Exception as e:
            print(f"  ✗ {task_id}: {e}")
    
    print("\nPipeline completed!")
    print(f"Results: {json.dumps(context, indent=2, default=str)[:500]}...")
