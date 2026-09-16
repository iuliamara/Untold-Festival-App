# Untold Festival App 🎶✨

<div align="center">
  <img src="https://untold.com/images/untold_logo_2023.svg" alt="Untold Logo" width="300" />
</div>
<br>

<details open>
<summary>🇬🇧 <b>English Version</b></summary>

<blockquote>
<h2>About UNTOLD Festival</h2>
<p>UNTOLD is one of the largest and most highly acclaimed electronic music festivals in Europe, held annually in the heart of Transylvania, in Cluj-Napoca, Romania. Since its inception in 2015, the festival has continuously brought the world's most renowned DJs, live acts, and millions of fans together for a unique, magical experience.</p>

<h2>About this Application</h2>
<p>This is a comprehensive management and ticketing application built specifically for the UNTOLD Festival ecosystem. The architecture is designed to handle both the administrative needs of the organizers and the immersive experience of the festival participants.</p>

<h3>Architecture Details:</h3>
<ul>
<li><b>Backend:</b> A monolithic Spring Boot REST API utilizing Java, Spring Security, Hibernate, and Flyway. It serves as the single source of truth for both frontend applications.</li>
<li><b>Frontend (Attendee):</b> A fast, responsive React + Vite application tailored for festival participants to browse line-ups, manage their profiles, and purchase tickets.</li>
<li><b>Frontend (Admin/Organizer):</b> A secure React + Vite dashboard designed for festival staff and organizers to manage events, track ticket sales, and oversee operations.</li>
<li><b>Database:</b> A robust PostgreSQL database handling complex relational data.</li>
<li><b>Infrastructure:</b> Fully orchestrated using Docker Compose for seamless local development and deployment.</li>
</ul>

<h3>Getting Started:</h3>
<p>To run the entire ecosystem locally, simply ensure Docker Desktop is running and execute:</p>
<code>docker-compose up --build</code>
</blockquote>

</details>

<details>
<summary>🇷🇴 <b>Versiunea în Română</b></summary>

<blockquote>
<h2>Despre Festivalul UNTOLD</h2>
<p>UNTOLD este unul dintre cele mai mari și mai apreciate festivaluri de muzică electronică din Europa, desfășurat anual în inima Transilvaniei, la Cluj-Napoca, România. Încă de la prima ediție din 2015, festivalul a adus continuu cei mai renumiți DJ, trupe live și milioane de fani împreună pentru o experiență magică și unică.</p>

<h2>Despre această Aplicație</h2>
<p>Aceasta este o aplicație completă de management și ticketing construită special pentru ecosistemul Festivalului UNTOLD. Arhitectura este concepută pentru a gestiona atât nevoile administrative ale organizatorilor, cât și experiența participanților la festival.</p>

<h3>Detalii despre Arhitectură:</h3>
<ul>
<li><b>Backend:</b> Un API REST monolitic construit cu Spring Boot, Java, Spring Security, Hibernate și Flyway. Acționează ca singura sursă de adevăr pentru ambele aplicații de frontend.</li>
<li><b>Frontend (Attendee):</b> O aplicație rapidă și responsivă scrisă în React + Vite, creată pentru ca participanții să exploreze line-up-urile, să-și gestioneze profilurile și să cumpere bilete.</li>
<li><b>Frontend (Admin/Organizator):</b> Un dashboard securizat React + Vite, conceput pentru echipa festivalului și organizatori pentru a gestiona evenimentele, a urmări vânzările de bilete și operațiunile logistice.</li>
<li><b>Baza de date:</b> O bază de date PostgreSQL robustă pentru prelucrarea datelor relaționale complexe.</li>
<li><b>Infrastructură:</b> Complet orchestrată folosind Docker Compose pentru o dezvoltare locală rapidă și uniformă.</li>
</ul>

<h3>Cum să pornești proiectul:</h3>
<p>Pentru a rula întregul ecosistem local, asigură-te că Docker Desktop funcționează și execută comanda:</p>
<code>docker-compose up --build</code>
</blockquote>

</details>

---

# Untold Connect: Ticket & Lineup Manager Ecosystem
### High-Fidelity Product Definition & Architecture

Welcome to the workspace of **Untold Connect**—a next-generation ticket management and live schedule web application designed specifically for the **UNTOLD Festival** (Cluj-Napoca, Romania), drawing structural and stylistic inspiration from the energetic digital experience of **Beach, Please!** and combining it with the mystical, cosmic identity of **UNTOLD**.

---

## 📂 Documentation Directory Structure

The project features a deeply-engineered, 4-part documentation package mapping out every functional, administrative, technical, and visual aspect of the application:

1.  **[Volume 1: Product Overview & Vision](file:///d:/info/projects/ticket_manager/docs/1_product_overview.md)**
    *   *Core Content:* Executive summary, brand hybrid positioning ("Cosmic Cyber-Magic"), problem statements, user personas (Andrei the attendee, Elena the organizer).
2.  **[Volume 2: Functional Specifications](file:///d:/info/projects/ticket_manager/docs/2_functional_specifications.md)**
    *   *Core Content:* Multi-tier user roles, comprehensive functional requirements (drag-and-drop scheduler, offline wallet, client schedule alerts, interactive maps), and narrative user stories.
3.  **[Volume 3: Technical Architecture & System Design](file:///d:/info/projects/ticket_manager/docs/3_technical_architecture.md)**
    *   *Core Content:* Fully-mapped database schema (PostgreSQL DDL), REST/WebSocket API endpoints, Workbox-driven offline service worker architecture, and cryptographic RS256 ticket validation.
4.  **[Volume 4: UI/UX Specification & Design System](file:///d:/info/projects/ticket_manager/docs/4_ui_ux_specification.md)**
    *   *Core Content:* Brand design system (Deep Obsidian background, Glowing Purples, Portal Cyans, and Luna Gold), micro-interactions (bouncy bookmarks, smooth page transitions), and layout standards.

---

## 💫 Core System Highlights

*   🎨 **Cosmic Cyber-Magic Theme:** Fusion of UNTOLD's celestial, portal-driven magical aura with the bold typography, high-impact glassmorphic cards, and glowing borders inspired by Beach, Please!
*   📶 **Offline-First PWA (Android Focus):** Fully optimized for Cluj Arena's notoriously packed cellular networks. The entire lineup database is cached locally, tickets are readable offline, and set reminder alarms trigger locally inside the Android browser shell even with zero cell service.
*   📅 **Real-Time Schedule Syncing:** Immediate push notices and schedule timeline shifts when an administrator alters set listings on the Organizer dashboard.
*   🎫 **Cryptographic Validation:** RS256 asymmetric signatures embedded directly within the ticket's QR codes, allowing gates to perform complete anti-fraud tickets verification offline.
