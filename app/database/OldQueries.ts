/**
 

CREATE TABLE IF NOT EXISTS trivia_questions (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    multiple_choice_answers JSONB DEFAULT '[]',
    verse_references JSONB NOT NULL DEFAULT '[]', 
    difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),
    attempts INTEGER NOT NULL DEFAULT 0,
    correct_attempts INTEGER NOT NULL DEFAULT 0
);

-- Index for fast queries by difficulty
CREATE INDEX IF NOT EXISTS idx_trivia_difficulty ON trivia_questions(difficulty);

-- GIN index for efficient JSONB querying on verse_references
CREATE INDEX IF NOT EXISTS idx_trivia_verse_references ON trivia_questions USING GIN(verse_references);

 */
