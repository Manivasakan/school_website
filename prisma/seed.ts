/**
 * Seeds:
 *   - 3 languages (Tamil default, English, Sinhala)
 *   - ~30 permissions across all modules
 *   - SuperAdmin role with all permissions
 *   - Initial SuperAdmin user (email + password from env)
 *   - Default site settings
 *   - Standard CMS pages: about, principal-message, admissions, house-system,
 *     old-boys, prize-fund, accessibility (each in 3 languages)
 *   - Sample welcome news
 *
 * Idempotent: safe to re-run.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const LANGUAGES = [
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", isDefault: true, sortOrder: 1 },
  { code: "en", name: "English", nativeName: "English", isDefault: false, sortOrder: 2 },
  { code: "si", name: "Sinhala", nativeName: "සිංහල", isDefault: false, sortOrder: 3 },
];

const PERMISSIONS: Array<{ module: string; action: string; description: string }> = [
  { module: "Dashboard", action: "View", description: "View admin dashboard" },
  { module: "News", action: "View", description: "View news entries" },
  { module: "News", action: "Create", description: "Create news entries" },
  { module: "News", action: "Edit", description: "Edit news entries" },
  { module: "News", action: "Delete", description: "Delete news entries" },
  { module: "News", action: "Publish", description: "Publish/unpublish news" },
  { module: "Pages", action: "View", description: "View static pages" },
  { module: "Pages", action: "Create", description: "Create new pages" },
  { module: "Pages", action: "Edit", description: "Edit page content" },
  { module: "Pages", action: "Delete", description: "Delete pages" },
  { module: "Pages", action: "Publish", description: "Publish/unpublish pages" },
  { module: "Events", action: "View", description: "View events" },
  { module: "Events", action: "Manage", description: "Create/edit/delete events" },
  { module: "Staff", action: "View", description: "View staff" },
  { module: "Staff", action: "Manage", description: "Create/edit/delete staff" },
  { module: "Media", action: "Upload", description: "Upload images" },
  { module: "Media", action: "Delete", description: "Delete media items" },
  { module: "Videos", action: "Manage", description: "Add/edit/delete video links" },
  { module: "Downloads", action: "Manage", description: "Add/edit/delete downloads" },
  { module: "Users", action: "View", description: "View users" },
  { module: "Users", action: "Create", description: "Create users" },
  { module: "Users", action: "Edit", description: "Edit users" },
  { module: "Users", action: "Delete", description: "Delete users" },
  { module: "Roles", action: "View", description: "View roles" },
  { module: "Roles", action: "Manage", description: "Create/edit/delete roles + assign permissions" },
  { module: "Languages", action: "Manage", description: "Enable/disable/reorder languages" },
  { module: "Settings", action: "Edit", description: "Edit site settings" },
  { module: "AuditLog", action: "View", description: "View audit log" },
];

const STANDARD_PAGES: Array<{
  slug: string;
  showInNav: boolean;
  sortOrder: number;
  translations: Array<{ languageCode: string; title: string; body: string }>;
}> = [
  {
    slug: "about",
    showInNav: true,
    sortOrder: 1,
    translations: [
      { languageCode: "ta", title: "எங்களைப் பற்றி", body: "<p>எங்கள் பாடசாலை வரலாறு, பார்வை, பணி.</p>" },
      { languageCode: "en", title: "About Us", body: "<p>Our school history, vision, and mission.</p>" },
      { languageCode: "si", title: "අප ගැන", body: "<p>අපගේ පාසලේ ඉතිහාසය, දැක්ම සහ මෙහෙවර.</p>" },
    ],
  },
  {
    slug: "principal-message",
    showInNav: true,
    sortOrder: 2,
    translations: [
      { languageCode: "ta", title: "அதிபர் செய்தி", body: "<p>எங்கள் அதிபரின் வரவேற்பு செய்தி.</p>" },
      { languageCode: "en", title: "Principal's Message", body: "<p>A welcome message from our Principal.</p>" },
      { languageCode: "si", title: "විදුහල්පතිගේ පණිවිඩය", body: "<p>අපගේ විදුහල්පතිගෙන් සාදරයෙන් පිළිගැනීමේ පණිවිඩයක්.</p>" },
    ],
  },
  {
    slug: "admissions",
    showInNav: true,
    sortOrder: 3,
    translations: [
      { languageCode: "ta", title: "சேர்க்கை", body: "<p>சேர்க்கை செயல்முறை, தகுதி, பதிவிறக்க படிவங்கள்.</p>" },
      { languageCode: "en", title: "Admissions", body: "<p>Admission process, eligibility, and downloadable forms.</p>" },
      { languageCode: "si", title: "ඇතුළත් කිරීම්", body: "<p>ඇතුළත් කිරීමේ ක්‍රියාවලිය, සුදුසුකම් සහ බාගත හැකි ආකෘති.</p>" },
    ],
  },
  {
    slug: "house-system",
    showInNav: false,
    sortOrder: 4,
    translations: [
      { languageCode: "ta", title: "இல்ல முறை", body: "<p>எங்கள் பாடசாலையின் இல்லங்கள் மற்றும் அவற்றின் வரலாறு.</p>" },
      { languageCode: "en", title: "House System", body: "<p>Our school's houses and their history.</p>" },
      { languageCode: "si", title: "නිවාස පද්ධතිය", body: "<p>අපගේ පාසලේ නිවාස සහ ඒවායේ ඉතිහාසය.</p>" },
    ],
  },
  {
    slug: "old-boys",
    showInNav: false,
    sortOrder: 5,
    translations: [
      { languageCode: "ta", title: "பழைய மாணவர் சங்கம்", body: "<p>எங்கள் பழைய மாணவர் சங்கம் மற்றும் கிளைகள்.</p>" },
      { languageCode: "en", title: "Old Students' Association", body: "<p>Our alumni association and international chapters.</p>" },
      { languageCode: "si", title: "පැරණි ශිෂ්‍ය සංගමය", body: "<p>අපගේ ආදී ශිෂ්‍ය සංගමය සහ ජාත්‍යන්තර ශාඛා.</p>" },
    ],
  },
  {
    slug: "prize-fund",
    showInNav: false,
    sortOrder: 6,
    translations: [
      { languageCode: "ta", title: "பரிசு நிதி", body: "<p>எங்கள் பாடசாலைக்கு நன்கொடை வழங்க உதவும் தகவல்கள்.</p>" },
      { languageCode: "en", title: "Donations / Prize Fund", body: "<p>How to support our school through donations.</p>" },
      { languageCode: "si", title: "ත්‍යාග අරමුදල", body: "<p>අපගේ පාසලට ආධාර කරන ආකාරය පිළිබඳ විස්තර.</p>" },
    ],
  },
  {
    slug: "accessibility",
    showInNav: false,
    sortOrder: 7,
    translations: [
      { languageCode: "ta", title: "அணுகல் கூற்று", body: "<p>இந்த இணையதளம் WCAG 2.1 AA தரத்தை பின்பற்றும் முயற்சியில் உள்ளது.</p>" },
      { languageCode: "en", title: "Accessibility Statement", body: "<p>This website strives to follow WCAG 2.1 AA standards.</p>" },
      { languageCode: "si", title: "ප්‍රවේශ්‍යතා ප්‍රකාශය", body: "<p>මෙම වෙබ් අඩවිය WCAG 2.1 AA ප්‍රමිතීන් අනුගමනය කිරීමට උත්සාහ කරයි.</p>" },
    ],
  },
];

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@school.lk";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe!2026";
  const adminName = process.env.SEED_ADMIN_NAME || "Super Admin";
  const schoolName = process.env.SEED_SCHOOL_NAME || "Jaffna Government School";
  const schoolShort = process.env.SEED_SCHOOL_SHORT || "JGS";

  console.log("→ Seeding languages...");
  for (const lang of LANGUAGES) {
    await prisma.language.upsert({
      where: { code: lang.code },
      create: lang,
      update: {},
    });
  }

  console.log("→ Seeding permissions...");
  const permissionRecords = [];
  for (const p of PERMISSIONS) {
    const key = `${p.module}.${p.action}`;
    const rec = await prisma.permission.upsert({
      where: { key },
      create: { key, module: p.module, action: p.action, description: p.description },
      update: { description: p.description },
    });
    permissionRecords.push(rec);
  }

  console.log("→ Seeding SuperAdmin role...");
  const superAdmin = await prisma.role.upsert({
    where: { name: "SuperAdmin" },
    create: {
      name: "SuperAdmin",
      description: "Full access to everything. Cannot be deleted.",
      isSystem: true,
    },
    update: {},
  });

  await prisma.rolePermission.deleteMany({ where: { roleId: superAdmin.id } });
  await prisma.rolePermission.createMany({
    data: permissionRecords.map((p) => ({ roleId: superAdmin.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  console.log(`→ Seeding initial SuperAdmin user (${adminEmail})...`);
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, passwordHash, fullName: adminName, isActive: true },
    update: {},
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: superAdmin.id } },
    create: { userId: user.id, roleId: superAdmin.id },
    update: {},
  });

  console.log("→ Seeding default site settings...");
  const defaultSettings = [
    { key: "site.name", value: schoolName },
    { key: "site.shortName", value: schoolShort },
    { key: "site.tagline", value: "Excellence in Education" },
    { key: "site.foundedYear", value: "1900" },
    { key: "site.studentCount", value: "5000" },
    { key: "contact.address", value: "Jaffna, Sri Lanka" },
    { key: "contact.phone", value: "+94 21 000 0000" },
    { key: "contact.email", value: "info@school.lk" },
    { key: "contact.whatsapp", value: "+94 77 000 0000" },
    { key: "social.facebook", value: "" },
    { key: "social.youtube", value: "" },
    { key: "social.instagram", value: "" },
    { key: "home.heroImage", value: "" },
  ];
  for (const s of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      create: s,
      update: {},
    });
  }

  console.log("→ Seeding standard CMS pages (3 languages each)...");
  for (const p of STANDARD_PAGES) {
    await prisma.page.upsert({
      where: { slug: p.slug },
      create: {
        slug: p.slug,
        isPublished: true,
        showInNav: p.showInNav,
        sortOrder: p.sortOrder,
        translations: { create: p.translations },
      },
      update: { showInNav: p.showInNav, sortOrder: p.sortOrder },
    });
  }

  console.log("→ Seeding sample welcome news...");
  await prisma.news.upsert({
    where: { slug: "welcome" },
    create: {
      slug: "welcome",
      isPublished: true,
      publishedAt: new Date(),
      translations: {
        create: [
          { languageCode: "ta", title: "எங்கள் புதிய இணையதளத்திற்கு வரவேற்கிறோம்", body: "<p>எங்கள் புதிய இணையதளத்தைப் பார்வையிட்டதற்கு நன்றி.</p>" },
          { languageCode: "en", title: "Welcome to our new website", body: "<p>Thank you for visiting our new website.</p>" },
          { languageCode: "si", title: "අපගේ නව වෙබ් අඩවියට සාදරයෙන් පිළිගනිමු", body: "<p>අපගේ නව වෙබ් අඩවියට පැමිණීම ගැන ස්තූතියි.</p>" },
        ],
      },
    },
    update: {},
  });

  console.log("\n✅ Seed complete.");
  console.log(`   Login at /admin/login with: ${adminEmail} / (the password from SEED_ADMIN_PASSWORD)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
