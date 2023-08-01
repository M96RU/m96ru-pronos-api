CREATE TABLE IF NOT EXISTS "matches"
(
    "id"    VARCHAR(50)      NOT NULL,
    "begin" TIMESTAMPTZ      NOT NULL,
    "home"  VARCHAR(50)      NOT NULL,
    "away"  VARCHAR(50)      NOT NULL,
    "h2h_1" DOUBLE PRECISION NOT NULL,
    "h2h_x" DOUBLE PRECISION NOT NULL,
    "h2h_2" DOUBLE PRECISION NOT NULL,
    PRIMARY KEY ("id")
);
