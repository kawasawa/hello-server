DROP TABLE IF EXISTS "users" CASCADE;

DROP TABLE IF EXISTS "auth" CASCADE;

DROP TABLE IF EXISTS "password_resets" CASCADE;

CREATE TABLE "users" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "password" TEXT NOT NULL,
  "verified" BOOLEAN NOT NULL DEFAULT FALSE,
  "signedin_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL,
  "updated_at" TIMESTAMP NOT NULL,
  PRIMARY KEY ("id"),
  UNIQUE ("email")
);

CREATE TABLE "auth" (
  "user_id" INTEGER NOT NULL,
  "token" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL,
  "updated_at" TIMESTAMP NOT NULL,
  PRIMARY KEY ("user_id"),
  UNIQUE ("token"),
  FOREIGN KEY ("user_id") REFERENCES users("id") ON DELETE CASCADE
);

CREATE TABLE "password_resets" (
  "email" VARCHAR(255) NOT NULL,
  "token" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL,
  "updated_at" TIMESTAMP NOT NULL,
  PRIMARY KEY ("email"),
  UNIQUE ("token"),
  FOREIGN KEY ("email") REFERENCES users("email") ON DELETE CASCADE ON UPDATE CASCADE
);
