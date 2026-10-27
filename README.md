# Enterprise IT Employee Offboarding & Decommissioning Tracker

A secure, audit-compliant IT Offboarding & Device Decommissioning system built for enterprise IT infrastructure teams. Integrates Microsoft Entra ID (Azure AD), Intune mobile & laptop wipes, BitLocker encryption key recovery vaults, and compliance sign-offs.

## 🚀 Key Features

- **6-Section Enterprise Decommissioning Checklist**:
  1. Entra ID (Azure) Account: Sign-in blocks, token revocation, MFA clearing, PIM role audits.
  2. Intune Devices & Hardware: Laptop & Android mobile wipe, FRP removal, BitLocker key export, asset register update.
  3. Email and Data: Shared mailbox conversion, OneDrive handover, auto-reply, litigation hold.
  4. Access Outside Azure: VPN, Wi-Fi 802.1X, Password Managers, Cloud Consoles (AWS/GCP), SaaS licenses.
  5. Physical and HR: Access badges, physical keys, hardware tokens (YubiKeys), NDA reminders.
  6. Final Checks & Governance: 30-day Purview audit log review, cooling-off account retention, compliance sign-offs.
- **Password-Protected Device & BitLocker Vault**: Secure encrypted credential storage for device BitLocker keys, local admin recovery passwords, and firmware PINs.
- **Master Template Editor**: Customize standard checklists for company-specific workflows.
- **Client-Side Audit PDF Export**: High-resolution, multi-page official audit certificate generation (`jsPDF` + `html2canvas`).
- **Cloud Persistence**: Real-time multi-admin synchronization powered by Firebase Firestore.

## 🛠️ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production
npm run build
```

## 🌐 Deploy to Production via GitHub (Free Hosting Options)

### Option A: Vercel (Recommended - 1-Click Free Hosting)
1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **"Add New Project"** and select this repository.
3. Framework Preset: **Vite**.
4. Click **"Deploy"**. Your app will be live on a permanent `.vercel.app` URL with free SSL!

### Option B: Netlify
1. Go to [netlify.com](https://netlify.com) and log in with GitHub.
2. Select **"Import from Git"** and choose this repository.
3. Build command: `npm run build`, Publish directory: `dist`.
4. Click **"Deploy Site"**.

### Option C: Run within Corporate LAN / On-Premises
Run on any internal IT server or VM:
```bash
npm run build
npm run preview -- --port 8080 --host 0.0.0.0
```
