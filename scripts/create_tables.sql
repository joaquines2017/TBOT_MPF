-- Tabla de contactos
CREATE TABLE IF NOT EXISTS contact (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de historial de mensajes
CREATE TABLE IF NOT EXISTS history (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'incoming' o 'outgoing'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de calificaciones de tickets
CREATE TABLE IF NOT EXISTS ticket_ratings (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    ticket_id INTEGER,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 4),
    redmine_updated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_history_phone ON history(phone);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON history(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_ratings_phone ON ticket_ratings(phone);
CREATE INDEX IF NOT EXISTS idx_ticket_ratings_ticket_id ON ticket_ratings(ticket_id);

-- Insertar comentarios en las tablas
COMMENT ON TABLE contact IS 'Almacena información de contactos de WhatsApp';
COMMENT ON TABLE history IS 'Historial de mensajes intercambiados con los usuarios';
COMMENT ON TABLE ticket_ratings IS 'Calificaciones de tickets asignadas por los usuarios';


