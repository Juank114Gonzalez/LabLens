-- Existing generators become evaluators: the public intake replaces the role,
-- so anyone who used to submit through an account now works the Lab inbox.
UPDATE "User" SET "role" = 'EVALUATOR' WHERE "role" = 'GENERATOR';

-- AlterEnum
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('EVALUATOR', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING ("role"::text::"Role");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'EVALUATOR';
DROP TYPE "Role_old";
