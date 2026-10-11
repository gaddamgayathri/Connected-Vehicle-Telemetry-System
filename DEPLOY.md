# Deploy notes (demo)

Backend env vars: DB_URL (jdbc:mysql://HOST:3306/DB?serverTimezone=UTC&useSSL=true), DB_USERNAME, DB_PASSWORD,
JWT_SECRET (32+ random chars), CORS_ORIGIN (your frontend URL, no trailing slash),
COOKIE_SECURE=true, COOKIE_SAMESITE=None (only if frontend and backend are on different domains; needs HTTPS).
Build: `mvn -DskipTests package` -> `java -jar target/*.jar` (Java 21).

Frontend: set VITE_API_URL=https://your-backend-url at build time (leave empty if same domain), then `npm run build`, serve `dist/`.
Single-page app: configure host to rewrite all routes to index.html.

Demo logins: admin@gmail.com / Admin@123, client1@gmail.com / Client@123
