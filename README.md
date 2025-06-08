# ☁️ Cloud Document Analytics Platform

> **A modern, AI-powered platform for uploading, searching, classifying, and analyzing documents in the cloud.**

---

## 🚀 Live Demo

🌐 **Try it online now:** [Cloud Document Analytics Platform](https://cloud-based-document-analytics-serv.vercel.app/)

---

## 📚 Table of Contents

- [Features Overview](#features-overview)
- [Feature Comparison Table](#feature-comparison-table)
- [Screenshots](#screenshots)
- [How It Works](#how-it-works)
- [Installation & Setup](#installation--setup)
- [Usage Guide](#usage-guide)
- [Tech Stack](#tech-stack)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)
- [Project Requirements & Approach](#project-requirements--approach)
- [Algorithms & Platform Choices](#algorithms--platform-choices)
- [Documentation & Reporting](#documentation--reporting)

---

## ✨ Features Overview

- **Drag-and-Drop Upload:** Upload PDF, DOC, DOCX, TXT, and more with a modern interface
- **Web Scraping:** Extract and analyze content directly from web pages via URL
- **AI-Powered Classification:** Automatic, explainable document categorization with multiple algorithms (AI, rule-based, hybrid)
- **Advanced Search:** Full-text, fuzzy, and filtered search with instant results
- **Analytics Dashboard:** Visualize document types, upload trends, and category distributions
- **Secure Cloud Storage:** All files and metadata stored securely with Supabase
- **User Authentication:** Secure sign-up, login, and access control
- **Responsive UI:** Works beautifully on desktop and mobile
- **Download & Delete:** Manage your documents with ease
- **Explainable AI:** See why documents are classified a certain way
- **Category Tree:** Hierarchical classification for academic, technical, business, and legal documents
- **Real-Time Feedback:** Toasts and progress indicators for all actions
- **Persistent Stats:** Track your document stats over time
- **Role-Based Access:** Admin and user roles supported
- **Live Demo:** Always-available online version for instant access

---

## 📊 Feature Comparison Table

| Feature                        | Local Version | Online Demo | Description                                                                 |
|------------------------------- |:------------:|:-----------:|-----------------------------------------------------------------------------|
| Drag-and-Drop Upload           |      ✅      |     ✅      | Upload documents from your device                                           |
| Web Scraping (URL Import)      |      ✅      |     ✅      | Import and analyze web pages                                                |
| AI Classification              |      ✅      |     ✅      | Automatic, explainable document categorization                              |
| Advanced Search                |      ✅      |     ✅      | Full-text, fuzzy, and filtered search                                       |
| Analytics Dashboard            |      ✅      |     ✅      | Visualize document types, trends, and categories                            |
| Secure Cloud Storage           |      ✅      |     ✅      | Files and metadata stored in Supabase                                       |
| User Authentication            |      ✅      |     ✅      | Sign up, login, and access control                                          |
| Download & Delete              |      ✅      |     ✅      | Manage your documents                                                      |
| Explainable AI                 |      ✅      |     ✅      | See classification confidence and rationale                                 |
| Category Tree                  |      ✅      |     ✅      | Hierarchical document classification                                        |
| Real-Time Feedback             |      ✅      |     ✅      | Toasts, progress bars, and instant updates                                  |
| Persistent Stats               |      ✅      |     ✅      | Track document stats over time                                              |
| Role-Based Access              |      ✅      |     ✅      | Admin and user roles                                                        |
| Mobile Responsive              |      ✅      |     ✅      | Works on all devices                                                        |
| Live Demo                      |      ❌      |     ✅      | No setup required, use instantly online                                     |

---

## 🛠️ How It Works

1. **Sign Up & Login:**
   - Secure authentication with Supabase Auth
   - Role-based access for users and admins
2. **Upload Documents:**
   - Drag and drop files or select from your device
   - Supported formats: PDF, DOC, DOCX, TXT, XLSX, PPTX, images, and more
   - Optionally, enter a URL to scrape and analyze web content
3. **AI Classification:**
   - Choose your preferred classification method (AI, rule-based, hybrid)
   - Documents are categorized into Academic, Technical, Business, Legal, and subcategories
   - Confidence scores and algorithm details are shown
4. **Search & Filter:**
   - Use the search bar to find documents by content, title, or metadata
   - Apply filters by type, category, or upload date
   - Sort results and view document details
5. **Analytics Dashboard:**
   - Visualize your document collection with bar, pie, and line charts
   - See trends, type distributions, and category breakdowns
6. **Manage Documents:**
   - Download, delete, or view details for each document
   - Real-time feedback for all actions

---

## 📦 Installation & Setup

### 1. Clone the repository
```bash
git clone git@github.com:Yosef-AlSabbah/Cloud-Based-Document-Analytics-Service.git
cd Cloud-Based-Document-Analytics-Service
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
- Copy `.env.example` to `.env` and fill in your Supabase credentials

### 4. Start the development server
```bash
npm run dev
```

### 5. Access the app
- Open [http://localhost:5173](http://localhost:5173) in your browser

---

## 📝 Usage Guide

### 1. **Sign Up & Login**
- Create an account or log in securely

### 2. **Upload Documents**
- Drag and drop files or select from your device
- Optionally, enter a URL to scrape and analyze web content
- Choose your preferred classification method (AI, rule-based, hybrid)

### 3. **Search & Filter**
- Use the search bar to find documents by content, title, or metadata
- Apply filters by type, category, or upload date

### 4. **View & Manage**
- Browse your documents in a sortable, filterable list
- Download, delete, or view details for each document

### 5. **Classification & Analytics**
- See automatic document categorization with confidence scores
- Explore analytics: document type distribution, upload trends, and more

---

## 🛠️ Tech Stack

| Layer      | Technology/Service                |
|------------|-----------------------------------|
| Frontend   | React, TypeScript, Vite           |
| UI         | Shadcn/UI, Lucide Icons, Tailwind |
| Backend    | Supabase (Postgres, Auth, Storage)|
| AI/ML      | Custom & hybrid classification    |
| Deployment | Vercel (CI/CD, CDN, Analytics)    |

---

## 🔒 Security
- All data is protected with Supabase Auth and Row Level Security
- Files are stored in user-specific buckets for privacy
- Environment variables are required for all sensitive credentials
- HTTPS enforced on the online demo
- User actions are logged for auditability

---

## 🤝 Contributing

1. Fork the repo and create your branch
2. Make your changes and add tests if needed
3. Open a pull request with a clear description
4. Follow the code style and best practices

---

## 📄 License

MIT License. See [LICENSE](./LICENSE) for details.

---

## 🙏 Credits

- Developed by **Yousef M. Y. Al Sabbah**
- Islamic University of Gaza - Faculty of Information Technology

---

## 📖 Project Requirements & Approach

This project was developed as a cloud-based program for basic data analytics, document search, sorting, and classification. Below is a summary of the requirements and how they are addressed in this platform:

### Requirements Addressed

| Requirement                                                                 | How It Is Addressed                                                                                                   |
|-----------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| Collect a large number of PDF/Word documents                                | Upload via drag-and-drop, file picker, or web scraping from URLs.                                                     |
| Store documents in the cloud                                                | Uses Supabase for secure, scalable cloud storage and database.                                                        |
| Update collection anytime                                                   | Upload new documents or scrape new sources at any time via the interface.                                             |
| Sort documents by title (extracted from document, not filename)             | Title extraction from document content; sorting and filtering in the UI.                                              |
| Search documents for text/keywords                                          | Full-text and fuzzy search with instant results; highlights found keywords in document previews.                      |
| Highlight search text in output documents                                   | Search results show highlighted keywords in context.                                                                  |
| Classify documents by a predefined tree using any algorithm                 | Hierarchical classification tree (Academic, Technical, Business, Legal, etc.) with AI, rule-based, or hybrid methods.|
| Provide statistics (size, number, search/sort/classify time, etc.)          | Analytics dashboard shows document count, size, upload trends, and operation timings.                                 |
| Use any programming language and cloud platform                             | Built with React/TypeScript (frontend), Supabase (cloud backend), Vercel (deployment).                                |
| Well-documented, readable, and maintainable source code                     | Modular, commented codebase; clear folder structure; usage and contribution guides in README.                         |
| GitHub repository and cloud program link                                    | [GitHub Source Code](https://github.com/Yosef-AlSabbah/Cloud-Based-Document-Analytics-Service) and [Live Demo](https://cloud-docu-analyzer-nexus.vercel.app) |
| Write a report describing algorithms, platform, and usage                   | See below for a summary of algorithms and platform choices.                                                          |

---

## 🧠 Algorithms & Platform Choices

- **Title Extraction:**
  - Extracts the actual document title from PDF/Word content using custom parsing utilities.
- **Sorting:**
  - Sorts documents by extracted title, not just filename, for more meaningful organization.
- **Search:**
  - Supports keyword, phrase, and fuzzy search. Highlights found terms in document previews.
- **Classification:**
  - Uses a hybrid approach: combines AI/ML (e.g., text embeddings, TF-IDF) with rule-based logic for robust, explainable classification.
  - Classification tree includes Academic, Technical, Business, Legal, and their subcategories.
- **Analytics:**
  - Tracks and displays statistics: document count, total size, upload/search/classification times, and trends over time.
- **Cloud Platform:**
  - Supabase for authentication, storage, and database; Vercel for deployment and CDN; React/TypeScript for frontend.

---

## 📑 Documentation & Reporting

- The source code is fully documented and organized for easy understanding and extension.
- This README serves as both a user and developer guide.
- For a detailed report on algorithms, platform decisions, and usage, see the attached project report template (if provided by your instructor).
- **GitHub Repository:** [https://github.com/Yosef-AlSabbah/Cloud-Based-Document-Analytics-Service](https://github.com/Yosef-AlSabbah/Cloud-Based-Document-Analytics-Service)
- **Live Cloud Program:** [https://cloud-based-document-analytics-serv.vercel.app](https://cloud-based-document-analytics-serv.vercel.app)

---

_Last updated: June 8, 2025_
