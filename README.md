# backend

## suggested project structure

```plaintext
backend/
├── README.md
├── .gitignore
├── .env.example
├── pom.xml                          # Maven configuration
├── Dockerfile.dev
├── Dockerfile.prod
├── docker-compose.yml
├── 
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── promata/
│   │   │           ├── ProMataApplication.java
│   │   │           ├── config/
│   │   │           │   ├── SecurityConfig.java
│   │   │           │   ├── DatabaseConfig.java
│   │   │           │   ├── JwtConfig.java
│   │   │           │   └── SwaggerConfig.java
│   │   │           ├── controller/
│   │   │           │   ├── AuthController.java
│   │   │           │   ├── UserController.java
│   │   │           │   ├── ReservationController.java
│   │   │           │   ├── AccommodationController.java
│   │   │           │   ├── ActivityController.java
│   │   │           │   └── AdminController.java
│   │   │           ├── service/
│   │   │           │   ├── AuthService.java
│   │   │           │   ├── UserService.java
│   │   │           │   ├── ReservationService.java
│   │   │           │   ├── AccommodationService.java
│   │   │           │   ├── ActivityService.java
│   │   │           │   ├── PaymentService.java
│   │   │           │   └── EmailService.java
│   │   │           ├── repository/
│   │   │           │   ├── UserRepository.java
│   │   │           │   ├── ReservationRepository.java
│   │   │           │   ├── AccommodationRepository.java
│   │   │           │   ├── ActivityRepository.java
│   │   │           │   └── PaymentRepository.java
│   │   │           ├── model/
│   │   │           │   ├── entity/
│   │   │           │   │   ├── User.java
│   │   │           │   │   ├── Reservation.java
│   │   │           │   │   ├── Accommodation.java
│   │   │           │   │   ├── Activity.java
│   │   │           │   │   ├── Payment.java
│   │   │           │   │   └── AuditEntity.java
│   │   │           │   ├── dto/
│   │   │           │   │   ├── request/
│   │   │           │   │   │   ├── LoginRequestDTO.java
│   │   │           │   │   │   ├── UserRegistrationDTO.java
│   │   │           │   │   │   ├── ReservationRequestDTO.java
│   │   │           │   │   │   └── PaymentRequestDTO.java
│   │   │           │   │   └── response/
│   │   │           │   │       ├── UserResponseDTO.java
│   │   │           │   │       ├── ReservationResponseDTO.java
│   │   │           │   │       ├── AccommodationResponseDTO.java
│   │   │           │   │       └── ApiResponseDTO.java
│   │   │           │   └── enums/
│   │   │           │       ├── UserType.java
│   │   │           │       ├── ReservationStatus.java
│   │   │           │       ├── AccommodationType.java
│   │   │           │       └── PaymentStatus.java
│   │   │           ├── security/
│   │   │           │   ├── JwtTokenProvider.java
│   │   │           │   ├── JwtAuthenticationFilter.java
│   │   │           │   ├── UserPrincipal.java
│   │   │           │   └── CustomUserDetailsService.java
│   │   │           ├── exception/
│   │   │           │   ├── GlobalExceptionHandler.java
│   │   │           │   ├── ResourceNotFoundException.java
│   │   │           │   ├── BadRequestException.java
│   │   │           │   └── UnauthorizedException.java
│   │   │           └── utils/
│   │   │               ├── DateUtils.java
│   │   │               ├── EmailUtils.java
│   │   │               └── ValidationUtils.java
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       ├── application-test.yml
│   │       ├── data.sql                 # Initial data
│   │       ├── schema.sql               # Database schema
│   │       └── static/
│   │           └── docs/                # API documentation
│   └── test/
│       └── java/
│           └── com/
│               └── promata/
│                   ├── integration/
│                   │   ├── AuthControllerTest.java
│                   │   ├── ReservationControllerTest.java
│                   │   └── UserControllerTest.java
│                   ├── service/
│                   │   ├── AuthServiceTest.java
│                   │   ├── ReservationServiceTest.java
│                   │   └── UserServiceTest.java
│                   └── repository/
│                       ├── UserRepositoryTest.java
│                       └── ReservationRepositoryTest.java
│
├── scripts/
│   ├── build.sh
│   ├── test.sh
│   ├── deploy.sh
│   └── database/
│       ├── migration/
│       └── seed/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── cd-dev.yml
│       ├── cd-prod.yml
│       └── security-scan.yml
│
└── docs/
    ├── API.md
    ├── SETUP.md
    ├── TESTING.md
    └── DEPLOYMENT.md
```
