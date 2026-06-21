import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    profile: { upsert: vi.fn() },
    application: { findUnique: vi.fn(), create: vi.fn() },
    cohort: { findFirst: vi.fn() },
  },
}));

import { ensureRegistrationRecords, syncUserAccess } from "../../../lib/access";
import { prisma } from "../../../lib/prisma";

const mockedPrisma = vi.mocked(prisma, true);

beforeEach(() => {
  process.env.ADMIN_EMAILS = "admin@shardup.local";
});

describe("syncUserAccess", () => {
  it("returns null when the user no longer exists", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    const result = await syncUserAccess("missing", "anyone@example.com");

    expect(result).toBeNull();
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  it("promotes a configured admin email to ADMIN/ACTIVE", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ role: "MEMBER", status: "PENDING" } as never);
    mockedPrisma.user.update.mockResolvedValue({
      id: "u1",
      role: "ADMIN",
      status: "ACTIVE",
    } as never);

    const result = await syncUserAccess("u1", "Admin@ShardUp.local");

    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: { role: "ADMIN", status: "ACTIVE" },
      }),
    );
    expect(result).toMatchObject({ role: "ADMIN", status: "ACTIVE" });
  });

  it("demotes an admin whose email is no longer configured", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ role: "ADMIN", status: "ACTIVE" } as never);
    mockedPrisma.user.update.mockResolvedValue({
      id: "u2",
      role: "MEMBER",
      status: "ACTIVE",
    } as never);

    const result = await syncUserAccess("u2", "former-admin@example.com");

    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { role: "MEMBER" } }),
    );
    expect(result).toMatchObject({ role: "MEMBER" });
  });

  it("leaves a regular member unchanged", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ role: "MEMBER", status: "ACTIVE" } as never);

    const result = await syncUserAccess("u3", "member@example.com");

    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
    expect(result).toEqual({ id: "u3", role: "MEMBER", status: "ACTIVE" });
  });
});

describe("ensureRegistrationRecords", () => {
  it("bails out when the user record is gone", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    await ensureRegistrationRecords("missing", "ghost@example.com");

    expect(mockedPrisma.profile.upsert).not.toHaveBeenCalled();
    expect(mockedPrisma.application.create).not.toHaveBeenCalled();
  });

  it("creates a draft application for a new non-admin member", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ role: "MEMBER", status: "PENDING" } as never);
    mockedPrisma.profile.upsert.mockResolvedValue({} as never);
    mockedPrisma.application.findUnique.mockResolvedValue(null);
    mockedPrisma.cohort.findFirst.mockResolvedValue({ id: "c1" } as never);
    mockedPrisma.application.create.mockResolvedValue({} as never);

    await ensureRegistrationRecords("u4", "member@example.com");

    expect(mockedPrisma.profile.upsert).toHaveBeenCalled();
    expect(mockedPrisma.application.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: "u4", status: "DRAFT", cohortId: "c1" } }),
    );
  });

  it("does not create an application for an admin", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ role: "MEMBER", status: "PENDING" } as never);
    mockedPrisma.user.update.mockResolvedValue({
      id: "u5",
      role: "ADMIN",
      status: "ACTIVE",
    } as never);
    mockedPrisma.profile.upsert.mockResolvedValue({} as never);
    mockedPrisma.application.findUnique.mockResolvedValue(null);

    await ensureRegistrationRecords("u5", "admin@shardup.local");

    expect(mockedPrisma.application.create).not.toHaveBeenCalled();
  });
});
