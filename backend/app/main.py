

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.accounts import router as accounts_router
from app.api.transactions import router as transactions_router
from app.api.beneficiaries import router as beneficiaries_router
from app.api.loans import router as loans_router
from app.api.admin import router as admin_router

from app.db.database import Base, engine
from app.models import entities


# Keep existing database initialization.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Fine Core Banking API",
    description="A simulated digital banking system for learning and practice.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register existing API routers.
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(accounts_router)
app.include_router(transactions_router)
app.include_router(beneficiaries_router)
app.include_router(loans_router)
app.include_router(admin_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to Fine Core Banking API",
        "docs": "/docs",
    }


# Register Prometheus metrics endpoint.
instrumentator = Instrumentator()
instrumentator.instrument(app)
instrumentator.expose(
    app,
    endpoint="/metrics",
    include_in_schema=False,
)
