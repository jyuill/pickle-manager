from fastapi import FastAPI, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from database import init_db, get_session
from models import Recipe, RecipeCreate, RecipeRead, RecipeUpdate, Batch, BatchCreate, BatchRead, BatchUpdate, TastingNote, TastingNoteCreate, TastingNoteRead
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
    # Add your production frontend URL here when you have it, e.g.:
    # "https://your-pickle-app.netlify.app",
    # Or allow all for development/testing (be careful in production):
    # "*",
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

@app.post("/recipes/", response_model=RecipeRead)
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

@app.patch("/recipes/{recipe_id}", response_model=RecipeRead)
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

@app.post("/batches/{batch_id}/tasting-notes/", response_model=TastingNoteRead)
def create_tasting_note(batch_id: str, note: TastingNoteCreate, session: Session = Depends(get_session)):
    batch = session.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
        
    db_note = TastingNote(batch_id=batch_id, **note.model_dump())
    session.add(db_note)
    session.commit()
    session.refresh(db_note)
    return db_note

@app.delete("/tasting-notes/{note_id}")
def delete_tasting_note(note_id: int, session: Session = Depends(get_session)):
    note = session.get(TastingNote, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    session.delete(note)
    session.commit()
    return {"ok": True}

@app.post("/batches/", response_model=BatchRead)
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

@app.patch("/batches/{batch_id}", response_model=BatchRead)
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

@app.get("/recipes/{recipe_id}/batches", response_model=List[BatchRead])
def read_batches_for_recipe(recipe_id: int, session: Session = Depends(get_session)):
    statement = select(Batch).where(Batch.recipe_id == recipe_id).order_by(Batch.made_date.desc())
    batches = session.exec(statement).all()
    return batches
