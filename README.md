# 🍃 MongoDB Learning Platform & Studio

An enterprise-grade, modern web-based MongoDB administration, schema analysis, aggregation pipeline builder, and learning platform built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Radix UI.

---

## ✨ Features

### 🔌 Connection Manager
- **Multi-Environment Support**: Connect seamlessly to Local instances (`localhost:27017`), MongoDB Atlas clusters (`mongodb+srv://`), or isolated Sandbox environments.
- **Connection Templates**: Pre-configured templates with 1-click credential autofill.
- **Encrypted Security**: Connection strings and credentials encrypted using AES-256 with HMAC validation.
- **Latency & Health Checks**: Real-time ping latency and connectivity verification.

### 🔍 Query Workbench & Document Browser
- **Visual & Code Querying**: Filter builder with support for comparison, logical, element, and regex operators.
- **Projection & Sorting**: Granular projection management and multi-field ascending/descending sort options.
- **Document Management**: Create, edit, clone, and delete BSON documents with strict schema validation.
- **Pagination & Export**: Paged document view with JSON and CSV export capabilities.

### ⚡ Visual Aggregation Pipeline Builder
- **Stage Construction**: Visually assemble multi-stage pipelines (`$match`, `$project`, `$group`, `$lookup`, `$unwind`, `$sort`, `$limit`).
- **Code Generation**: Instant 1-click code export to MongoDB Shell (`mongosh`), Node.js driver, and Python PyMongo.
- **Pipeline Optimization**: Automated stage reordering recommendations (early filtering, index hints).
- **Execution Stats**: In-depth explain plan analysis and document flow metrics.

### 📐 Schema Inference & Data Profiler
- **Automated Schema Discovery**: Inferred data types, optional vs. required fields, and nested structures.
- **Data Quality Scoring**: Null value ratios, duplicate detection, and schema consistency scoring.
- **Relationship Mapping**: Auto-detection of references and embedded relations across collections.
- **Index Management**: Create single-field, compound, text, geospatial (2dsphere), and TTL indexes with visual keys editor.

### 📈 Performance Monitor & Diagnostics
- **Live Metrics**: Real-time throughput (ops/sec), connection pools, memory usage (resident, virtual), and global lock statistics.
- **Slow Query Profiler**: Profiler threshold tracking, query duration analysis, and index suggestion engine.
- **Index Utilization**: Hit ratios, memory footprints, and identification of unused indexes.

### 🧪 Isolated Sandbox Mode
- **Zero-Config Playground**: Preloaded datasets (`sample_mflix`, `sample_airbnb`, `sample_analytics`) for experimentation without risk to production databases.
- **Reset Functionality**: Instant 1-click snapshot restore to cleanly test write operations.

### ⚙️ Preferences & Documentation
- **In-App Cheat Sheet & Docs**: Comprehensive MongoDB reference guide with live search, operator definitions, and copy-to-clipboard code snippets.
- **Personalized Safety Settings**: Query execution limits, confirmation safeguards on destructive operations, and customizable editor font sizes.
- **Responsive Theme Design**: Sleek dark and light themes, collapsible sidebar, and full mobile drawer navigation.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components & Route Handlers)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict type safety, zero `any` compromises)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom design tokens and HSL color system
- **UI Components**: [Radix UI](https://www.radix-ui.com/) primitives & [Lucide React](https://lucide.dev/) icons
- **Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/) / `@monaco-editor/react`
- **Database Driver**: Official [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18.17.0 or higher
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) or [pnpm](https://pnpm.io/)
- A local or remote MongoDB instance (optional; Sandbox mode works out-of-the-box)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd "No-Sql activity 2"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   *Update `.env.local` with your database URIs and secret keys if connecting to custom instances.*

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Build

To create an optimized production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run start
```

---

## 📁 Project Structure

```
├── src/
│   ├── app/                      # Next.js App Router pages and API route handlers
│   │   ├── api/                  # RESTful API endpoints for connections, schema, queries
│   │   ├── layout.tsx            # Root layout with theme provider and header
│   │   └── page.tsx              # Main dashboard entry
│   ├── components/               # React component library
│   │   ├── dashboard/            # Specialized dashboard views and modals
│   │   │   ├── connection-manager.tsx
│   │   │   ├── document-viewer.tsx
│   │   │   ├── aggregation-builder.tsx
│   │   │   ├── schema-designer.tsx
│   │   │   ├── index-manager.tsx
│   │   │   ├── performance-dashboard.tsx
│   │   │   ├── sandbox-mode.tsx
│   │   │   ├── preferences-dialog.tsx
│   │   │   ├── documentation-dialog.tsx
│   │   │   └── sign-out-dialog.tsx
│   │   └── ui/                   # Modular Radix UI primitives (Button, Dialog, Select, etc.)
│   ├── lib/                      # Encryption, utilities, and helper functions
│   ├── services/                 # Business logic and MongoDB driver services
│   │   ├── mongodb/              # Connection management, query generation, schema inference
│   │   ├── monitoring/           # Performance diagnostics and metrics collector
│   │   ├── data-engineering/     # Import/export and data lineage tracking
│   │   └── sandbox/              # Mock dataset provisioner and sandbox runtime
│   └── types/                    # TypeScript interfaces, unions, and BSON types
├── public/                       # Static public assets
├── .env.example                  # Environment variable reference template
├── .gitignore                    # Production git ignore configuration
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS design system tokens
└── tsconfig.json                 # TypeScript compiler configuration
```

---

## 🔒 Security Best Practices

- All database connection strings are encrypted before persistence.
- Built-in query sanitization to strip dangerous server-side script execution operators (`$where`, `$eval`, `$accumulator`).
- Session isolation and quick sign-out cache wipe.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
