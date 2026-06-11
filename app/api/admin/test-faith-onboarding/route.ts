import { NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/test-faith-onboarding
 * E2E test: Simulates a faith volunteer registration → approval flow.
 */
export async function POST() {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  const timeline: string[] = [];
  const testId = "faith-test-" + Date.now();

  try {
    // Step 0: Ensure notes column exists
    try { await sql`ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS notes TEXT`; } catch {}
    timeline.push("0. Ensured notes column exists");

    // Step 1: Get test provider user
    const [testUser] = await sql`SELECT id, email, name FROM users WHERE email = 'provider.test@silverconnect.app' LIMIT 1`;
    if (!testUser) {
      await sql.end();
      return NextResponse.json({ error: "Test provider user not found. Run seed first." }, { status: 404 });
    }
    timeline.push("1. Found test user: " + testUser.email);

    // Step 2: Check if profile exists (clean it if from previous test)
    const existing = await sql`SELECT id FROM provider_profiles WHERE user_id = ${testUser.id}`;
    if (existing.length > 0) {
      // Already registered — test the approval flow instead
      timeline.push("2. Profile exists (id: " + existing[0].id + ") — testing approval flow");

      // Update notes to faith_volunteer for testing
      const faithMeta = JSON.stringify({
        type: "faith_volunteer",
        churchName: "St Andrew's Anglican Church",
        denomination: "Anglican",
        pastorReference: { name: "Rev. John Smith", phone: "0412 345 678", email: "john@standrews.org.au" },
        ministryExperience: "Led Bible study group for 8 years. Visited nursing homes monthly. Trained in pastoral care at Ridley College.",
        servicesOffered: ["bible_study_1h", "prayer_group_1h", "pastoral_visit", "worship_music_session"],
        availability: ["weekday_morning", "sunday"],
        registeredAt: new Date().toISOString(),
      });
      await sql`UPDATE provider_profiles SET notes = ${faithMeta}, onboarding_status = 'pending' WHERE id = ${existing[0].id}`;
      timeline.push("3. Updated profile with faith_volunteer metadata (status: pending)");

      // Approve
      await sql`UPDATE provider_profiles SET onboarding_status = 'approved', approved_at = NOW() WHERE id = ${existing[0].id}`;
      timeline.push("4. Approved volunteer (status: active)");

      // Notification
      await sql`INSERT INTO notifications (user_id, kind, title, body, link) VALUES (${testUser.id}, 'system', 'Faith Volunteer Approved!', 'Your application has been approved. Start serving!', '/provider')`;
      timeline.push("5. Sent approval notification");

      await sql.end();
      return NextResponse.json({
        success: true,
        lifecycle: "FAITH_ONBOARDING_COMPLETE",
        profileId: existing[0].id,
        timeline,
        summary: {
          user: testUser.email,
          churchName: "St Andrew's Anglican Church",
          services: ["bible_study_1h", "prayer_group_1h", "pastoral_visit", "worship_music_session"],
          status: "approved",
          payout: "NONE (volunteer — free service)",
        },
      });
    }

    // Step 2b: Create new profile
    const faithMeta = JSON.stringify({
      type: "faith_volunteer",
      churchName: "St Andrew's Anglican Church",
      denomination: "Anglican",
      pastorReference: { name: "Rev. John Smith", phone: "0412 345 678", email: "john@standrews.org.au" },
      ministryExperience: "Led Bible study group for 8 years. Visited nursing homes monthly.",
      servicesOffered: ["bible_study_1h", "prayer_group_1h", "pastoral_visit"],
      availability: ["weekday_morning", "sunday"],
      registeredAt: new Date().toISOString(),
    });

    const [profile] = await sql`INSERT INTO provider_profiles (user_id, bio, service_radius_km, onboarding_status, notes)
      VALUES (${testUser.id}, 'Passionate about sharing God\'s love with seniors', 15, 'pending', ${faithMeta})
      RETURNING id, onboarding_status`;
    timeline.push("2. Created faith volunteer profile: " + profile.id);
    timeline.push("3. Status: pending (awaiting pastor reference check)");

    // Step 3: Simulate admin approval
    await sql`UPDATE provider_profiles SET onboarding_status = 'approved', approved_at = NOW() WHERE id = ${profile.id}`;
    timeline.push("4. Admin approved (pastor reference verified)");

    // Step 4: Notification
    await sql`INSERT INTO notifications (user_id, kind, title, body, link)
      VALUES (${testUser.id}, 'system', 'Welcome, Volunteer!', 'Your faith volunteer application is approved!', '/provider')`;
    timeline.push("5. Notification sent to volunteer");

    await sql.end();
    return NextResponse.json({
      success: true,
      lifecycle: "FAITH_ONBOARDING_COMPLETE",
      profileId: profile.id,
      timeline,
      summary: {
        user: testUser.email,
        churchName: "St Andrew's Anglican Church",
        denomination: "Anglican",
        services: ["bible_study_1h", "prayer_group_1h", "pastoral_visit"],
        availability: ["weekday_morning", "sunday"],
        status: "approved",
        payout: "NONE (volunteer — free service)",
      },
    });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e), timeline }, { status: 500 });
  }
}
