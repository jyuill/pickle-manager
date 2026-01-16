from fastapi import FastAPI, Depends, HTTPException, status
from dotenv import load_dotenv
import os

load_dotenv()

from sqlmodel import Session, select
from typing import List, Optional
from database import init_db, get_session
from models import Recipe, RecipeCreate, RecipeRead, RecipeUpdate, Batch, BatchCreate, BatchRead, BatchUpdate, TastingNote, TastingNoteCreate, TastingNoteRead, TastingNoteUpdate, BatchImage, BatchImageBase
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://picklemanager.netlify.app",
    "https://www.picklejohnny.com",
    "https://picklejohnny.com",
]

# You can also use an environment variable for flexible configuration
import os
if os.getenv("FRONTEND_URL"):
    origins.append(os.getenv("FRONTEND_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Security & Cloudinary ---
from fastapi import Header, Query
from sqlalchemy import func
import hashlib
import time

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "pickle_secret")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")

def verify_admin(x_admin_password: str = Header(None)):
    if x_admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid Admin Password")
    return True

@app.get("/stats")
def get_stats(session: Session = Depends(get_session)):
    total_recipes = session.exec(select(func.count(Recipe.id))).one()
    total_batches = session.exec(select(func.count(Batch.id))).one()
    
    # Avg rating
    avg_rating_res = session.exec(select(func.avg(TastingNote.rating))).one()
    avg_rating = round(float(avg_rating_res), 1) if avg_rating_res is not None else 0.0
    
    # Activity
    activity_res = session.exec(select(Batch.made_date, func.count(Batch.id)).group_by(Batch.made_date)).all()
    
    activity = []
    for dt, count in activity_res:
        level = 0
        if count > 0: level = 1
        if count >= 2: level = 2
        if count >= 3: level = 3
        if count >= 5: level = 4
        
        activity.append({
            "date": dt.isoformat(),
            "count": count,
            "level": level
        })
        
    activity.sort(key=lambda x: x['date'])
        
    return {
        "total_recipes": total_recipes,
        "total_batches": total_batches,
        "average_rating": avg_rating,
        "activity": activity
    }

@app.get("/signature", dependencies=[Depends(verify_admin)])
def get_signature(upload_preset: Optional[str] = None):
    if not CLOUDINARY_API_SECRET:
        raise HTTPException(status_code=500, detail="Cloudinary Secret not configured")
    
    timestamp = int(time.time())
    params = {"timestamp": timestamp}
    if upload_preset:
        params["upload_preset"] = upload_preset
    
    # Sort and concatenate
    sorted_params = sorted(params.items())
    string_to_sign = "&".join([f"{k}={v}" for k, v in sorted_params])
    string_to_sign += CLOUDINARY_API_SECRET
    
    signature = hashlib.sha1(string_to_sign.encode('utf-8')).hexdigest()
    return {"signature": signature, "timestamp": timestamp}

# --- Endpoints ---

@app.post("/recipes/", response_model=RecipeRead, dependencies=[Depends(verify_admin)])
def create_recipe(recipe: RecipeCreate, session: Session = Depends(get_session)):
    db_recipe = Recipe.from_orm(recipe)
    session.add(db_recipe)
    session.commit()
    session.refresh(db_recipe)
    return db_recipe

@app.get("/recipes/", response_model=List[RecipeRead])
def read_recipes(offset: int = 0, limit: int = 100, session: Session = Depends(get_session)):
    recipes = session.exec(select(Recipe).offset(offset).limit(limit)).all()
    return recipes

@app.get("/recipes/{recipe_id}", response_model=RecipeRead)
def read_recipe(recipe_id: int, session: Session = Depends(get_session)):
    recipe = session.get(Recipe, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe

@app.patch("/recipes/{recipe_id}", response_model=RecipeRead, dependencies=[Depends(verify_admin)])
def update_recipe(recipe_id: int, recipe_update: RecipeUpdate, session: Session = Depends(get_session)):
    db_recipe = session.get(Recipe, recipe_id)
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    recipe_data = recipe_update.model_dump(exclude_unset=True)
    for key, value in recipe_data.items():
        setattr(db_recipe, key, value)
    
    db_recipe.updated_at = datetime.utcnow()
    session.add(db_recipe)
    session.commit()
    session.refresh(db_recipe)
    return db_recipe

from typing import Optional

@app.get("/batches/", response_model=List[BatchRead])
def read_all_batches(
    sort_by_date: bool = True,
    min_rating: Optional[int] = None,
    max_rating: Optional[int] = None,
    recipe_name: Optional[str] = None,
    session: Session = Depends(get_session)
):
    query = select(Batch)
    
    if recipe_name:
        query = query.join(Recipe).where(Recipe.name.contains(recipe_name))
        
    if sort_by_date:
        query = query.order_by(Batch.made_date.desc())
        
    db_batches = session.exec(query).all()
    
    db_batches = session.exec(query).all()
    
    # Python-side processing for average rating and filtering
    filtered_batches = []
    for b in db_batches:
        # Calculate stats
        notes = b.tasting_notes
        if not notes:
            # If any rating filter is set, skip batches with no notes
            if min_rating or max_rating:
                continue
            avg_rating = None
        else:
            ratings = [n.rating for n in notes]
            avg_rating = sum(ratings) / len(ratings)
            min_r = min(ratings)
            max_r = max(ratings)
            
            # Strict Filter Logic (Equality on Min/Max bounds)
            # "Min selection ... equals that number" -> Batch's LOWEST rating must be == min_rating
            # "Max selection ... equals that number" -> Batch's HIGHEST rating must be == max_rating
            
            # Implementation Note: 
            # If User selects "Min 3", they generally mean "Quality Floor >= 3".
            # But the user specifically complained about "shows batches with rating lower than selected".
            # So `min_r < min_rating` is definitely OUT.
            # And `max_r < max_rating` is definitely OUT?. 
            
            # Re-reading user request: "minimum star selection shows only the batches where the minimum rating **equals** that number of stars."
            # That implies strict equality.
            
            if min_rating:
                if min_r != min_rating:
                    continue
            
            if max_rating:
                if max_r != max_rating:
                    continue
            
        # Convert to Read model and populate average_rating
        batch_read = BatchRead.from_orm(b)
        batch_read.average_rating = round(avg_rating, 1) if avg_rating is not None else None
        filtered_batches.append(batch_read)
        
    return filtered_batches

@app.post("/batches/{batch_id}/tasting-notes/", response_model=TastingNoteRead, dependencies=[Depends(verify_admin)])
def create_tasting_note(batch_id: str, note: TastingNoteCreate, session: Session = Depends(get_session)):
    batch = session.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
        
    db_note = TastingNote(batch_id=batch_id, **note.model_dump())
    session.add(db_note)
    session.commit()
    session.refresh(db_note)
    return db_note

@app.post("/batches/{batch_id}/images/", response_model=BatchImageBase, dependencies=[Depends(verify_admin)])
def create_batch_image(batch_id: str, image: BatchImageBase, session: Session = Depends(get_session)):
    batch = session.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
        
    db_image = BatchImage(batch_id=batch_id, image_url=image.image_url)
    session.add(db_image)
    session.commit()
    session.refresh(db_image)
    return db_image

@app.patch("/tasting-notes/{note_id}", response_model=TastingNoteRead, dependencies=[Depends(verify_admin)])
def update_tasting_note(note_id: int, note_update: TastingNoteUpdate, session: Session = Depends(get_session)):
    db_note = session.get(TastingNote, note_id)
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    note_data = note_update.model_dump(exclude_unset=True)
    for key, value in note_data.items():
        setattr(db_note, key, value)
    
    session.add(db_note)
    session.commit()
    session.refresh(db_note)
    return db_note

@app.delete("/tasting-notes/{note_id}", dependencies=[Depends(verify_admin)])
def delete_tasting_note(note_id: int, session: Session = Depends(get_session)):
    note = session.get(TastingNote, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    session.delete(note)
    session.commit()
    return {"ok": True}

@app.delete("/tasting-notes/{note_id}/image", dependencies=[Depends(verify_admin)])
def delete_tasting_note_image(note_id: int, session: Session = Depends(get_session)):
    note = session.get(TastingNote, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    note.image_url = None
    session.add(note)
    session.commit()
    session.refresh(note)
    return note

@app.delete("/batch-images/{image_id}", dependencies=[Depends(verify_admin)])
def delete_batch_image(image_id: int, session: Session = Depends(get_session)):
    image = session.get(BatchImage, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    session.delete(image)
    session.commit()
    return {"ok": True}

@app.post("/batches/", response_model=BatchRead, dependencies=[Depends(verify_admin)])
def create_batch(batch: BatchCreate, session: Session = Depends(get_session)):
    # ID Generation Logic
    # date_made is expected to be YYYY-MM-DD
    # We want YYMMDD
    date_made = batch.made_date
    date_str = date_made.strftime("%y%m%d")
    
    # Find existing batches for that date
    statement = select(Batch).where(Batch.id.like(f"{date_str}%"))
    existing_batches = session.exec(statement).all()
    
    if not existing_batches:
        new_id = date_str
    else:
        # Find the max suffix
        max_suffix = 1
        for b in existing_batches:
            if "-" in b.id:
                try:
                    suffix_part = b.id.split("-")[1]
                    if suffix_part.isdigit():
                        suffix = int(suffix_part)
                        if suffix >= max_suffix:
                            max_suffix = suffix + 1
                except ValueError:
                    pass
            elif b.id == date_str:
                if max_suffix == 1:
                    max_suffix = 2
        
        new_id = f"{date_str}-{max_suffix}"

    batch_data = batch.model_dump()
    batch_data["id"] = new_id
    db_batch = Batch(**batch_data)
    session.add(db_batch)
    session.commit()
    session.refresh(db_batch)
    return db_batch

@app.patch("/batches/{batch_id}", response_model=BatchRead, dependencies=[Depends(verify_admin)])
def update_batch(batch_id: str, batch_update: BatchUpdate, session: Session = Depends(get_session)):
    db_batch = session.get(Batch, batch_id)
    if not db_batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    batch_data = batch_update.model_dump(exclude_unset=True)
    for key, value in batch_data.items():
        setattr(db_batch, key, value)
    
    session.add(db_batch)
    session.commit()
    session.refresh(db_batch)
    return db_batch

@app.get("/batches/{batch_id}", response_model=BatchRead)
def read_batch(batch_id: str, session: Session = Depends(get_session)):
    batch = session.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch

    return batch

@app.delete("/batches/{batch_id}", dependencies=[Depends(verify_admin)])
def delete_batch(batch_id: str, session: Session = Depends(get_session)):
    batch = session.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    session.delete(batch)
    session.commit()
    return {"ok": True}

@app.get("/recipes/{recipe_id}/batches", response_model=List[BatchRead])
def read_batches_for_recipe(recipe_id: int, session: Session = Depends(get_session)):
    statement = select(Batch).where(Batch.recipe_id == recipe_id).order_by(Batch.made_date.desc())
    batches = session.exec(statement).all()
    return batches
