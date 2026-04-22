-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "licenseNumber" TEXT,
    "firmName" TEXT,
    "firmAddress" TEXT,
    "firmPhone" TEXT,
    "firmLicense" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "form_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formNumber" TEXT NOT NULL,
    "formName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "pdfFilePath" TEXT NOT NULL,
    "fieldMappings" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "packages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "propertyAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "clientLinkToken" TEXT NOT NULL,
    "clientLinkExpiresAt" DATETIME NOT NULL,
    "formsSelected" TEXT NOT NULL,
    "agentData" TEXT NOT NULL DEFAULT '{}',
    "clientData" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "packages_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "package_signers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "docusealSubmissionId" TEXT,
    "signedAt" DATETIME,
    CONSTRAINT "package_signers_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "agents_email_key" ON "agents"("email");

-- CreateIndex
CREATE UNIQUE INDEX "form_templates_formNumber_key" ON "form_templates"("formNumber");

-- CreateIndex
CREATE UNIQUE INDEX "packages_clientLinkToken_key" ON "packages"("clientLinkToken");
