CREATE TABLE IF NOT EXISTS "bets"
(
    "match_id"      VARCHAR(50)      NOT NULL,
    "user_id"      VARCHAR(50)      NOT NULL,
    "creation_date" TIMESTAMPTZ      NOT NULL,
    "choice"        VARCHAR(50)      NOT NULL,
    "price"         DOUBLE PRECISION NOT NULL,
    PRIMARY KEY ("match_id", "user_id")
);
