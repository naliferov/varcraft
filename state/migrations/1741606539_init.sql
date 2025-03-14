CREATE TABLE objects (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL,
    previous_id INTEGER REFERENCES objects(id) ON DELETE SET NULL,
    next_id INTEGER REFERENCES objects(id) ON DELETE SET NULL
);

CREATE TABLE objects_operations (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL,
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id)
);

CREATE TABLE project_object (
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    object_id INTEGER REFERENCES objects(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, object_id)
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(25) NOT NULL,
    phash VARCHAR(64) NOT NULL
);