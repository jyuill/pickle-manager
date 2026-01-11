from typing import Optional, List
from sqlmodel import Field, Relationship, SQLModel
from datetime import datetime, date

class RecipeBase(SQLModel):
    name: str
    ingredients: str
    instructions: str

class Recipe(RecipeBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    batches: List["Batch"] = Relationship(back_populates="recipe")

class RecipeCreate(RecipeBase):
    pass

class RecipeUpdate(RecipeBase):
    name: Optional[str] = None
    ingredients: Optional[str] = None
    instructions: Optional[str] = None

class RecipeRead(RecipeBase):
    id: int
    created_at: datetime
    updated_at: datetime

class BatchBase(SQLModel):
    notes: Optional[str] = None
    made_date: date = Field(default_factory=date.today)
    fridge_date: Optional[date] = None

class Batch(BatchBase, table=True):
    id: str = Field(primary_key=True) 
    # ID format: YYMMDD-X. Checked application side logic for generation.
    recipe_id: int = Field(foreign_key="recipe.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    recipe: Recipe = Relationship(back_populates="batches")
    tasting_notes: List["TastingNote"] = Relationship(back_populates="batch")

class TastingNoteBase(SQLModel):
    reviewer_name: str
    note: str
    rating: int

class TastingNote(TastingNoteBase, table=True):
    __tablename__ = "tasting_note"
    id: Optional[int] = Field(default=None, primary_key=True)
    batch_id: str = Field(foreign_key="batch.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    batch: Batch = Relationship(back_populates="tasting_notes")

class TastingNoteCreate(TastingNoteBase):
    pass

class TastingNoteRead(TastingNoteBase):
    id: int
    batch_id: str
    created_at: datetime

class BatchCreate(BatchBase):
    recipe_id: int

class BatchUpdate(BatchBase):
    recipe_id: Optional[int] = None
    made_date: Optional[date] = None
    fridge_date: Optional[date] = None
    notes: Optional[str] = None

class BatchRead(BatchBase):
    id: str
    recipe_id: int
    created_at: datetime
    tasting_notes: List[TastingNoteRead] = []
    average_rating: Optional[float] = None
