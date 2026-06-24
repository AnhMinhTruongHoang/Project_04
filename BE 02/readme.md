Backend setup:

1. Start MySQL in XAMPP
2. Open http://localhost/phpmyadmin
3. Create database: demo_hibernate
4. Run backend:

   cd "BE 02"
   .\mvnw.cmd spring-boot:run

Default database config:

- host: localhost
- port: 3306
- database: demo_hibernate
- username: root
- password: empty

If your MySQL root has password:
PowerShell:
$env:DB_PASSWORD="your_password"
.\mvnw.cmd spring-boot:run
