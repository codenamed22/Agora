-- Extend member profiles with public directory fields.
ALTER TABLE "Profile" ADD COLUMN "college" TEXT;
ALTER TABLE "Profile" ADD COLUMN "resumeUrl" TEXT;
ALTER TABLE "Profile" ADD COLUMN "photoUrl" TEXT;

-- Admin-managed member badges.
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MemberBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "awardedById" TEXT,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberBadge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Badge_name_key" ON "Badge"("name");
CREATE UNIQUE INDEX "MemberBadge_userId_badgeId_key" ON "MemberBadge"("userId", "badgeId");
CREATE INDEX "MemberBadge_badgeId_idx" ON "MemberBadge"("badgeId");
CREATE INDEX "MemberBadge_awardedById_idx" ON "MemberBadge"("awardedById");

ALTER TABLE "MemberBadge" ADD CONSTRAINT "MemberBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemberBadge" ADD CONSTRAINT "MemberBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemberBadge" ADD CONSTRAINT "MemberBadge_awardedById_fkey" FOREIGN KEY ("awardedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
