import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
import logging
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
from lib.db import client, ensure_indexes

from routers import (
    admin_content,
    admin_crm,
    admin_properties,
    auth,
    catalog,
    leads_public,
)


# Startup runs before the yield, shutdown after it.
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.index_task = asyncio.create_task(ensure_indexes())  # background: a big index build must not block boot
    yield
    client.close()


# Create the main app without a prefix
app = FastAPI(lifespan=lifespan)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Anne Carvalho Imóveis — API"}


# All feature routes live on api_router (prefix /api) — never directly on app.
api_router.include_router(auth.router)
api_router.include_router(catalog.router)
api_router.include_router(leads_public.router)
# Admin surface: every route under /api/admin/* and gated by get_current_admin (router-level dependency).
api_router.include_router(admin_properties.router, prefix="/admin")
api_router.include_router(admin_crm.router, prefix="/admin")
api_router.include_router(admin_content.router, prefix="/admin")

app.include_router(api_router)

# Persisted uploads (property photos, PDFs, logo) served under /api so the
# Vite proxy and the single-origin production setup reach them.
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
