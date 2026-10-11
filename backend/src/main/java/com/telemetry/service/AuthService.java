package com.telemetry.service;

import com.telemetry.dto.auth.LoginRequest;
import com.telemetry.dto.auth.RegisterRequest;
import com.telemetry.entity.Role;
import com.telemetry.entity.User;
import com.telemetry.exception.EmailAlreadyRegisteredException;
import com.telemetry.exception.InvalidCredentialsException;
import com.telemetry.repository.UserRepository;
import com.telemetry.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;

    public record AuthResult(String token, User user) {}

    public User register(RegisterRequest req) {
        String email = req.getEmail().trim().toLowerCase(Locale.ROOT);

        if (userRepo.existsByEmail(email)) {
            throw new EmailAlreadyRegisteredException();
        }

        User user = User.builder()
                .email(email)
                .passwordHash(encoder.encode(req.getPassword()))
                .fullName(req.getFullName().trim())
                .role(Role.CLIENT)
                .status("PENDING")
                .createdAt(Instant.now())
                .build();

        return userRepo.save(user);
    }

    public AuthResult login(LoginRequest req) {
        User user = userRepo.findByEmail(
                req.getEmail().trim().toLowerCase(Locale.ROOT)
        ).orElseThrow(InvalidCredentialsException::new);

        if (!encoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new InvalidCredentialsException();
        }

        String token = jwtService.generate(
                user.getUserId(),
                user.getEmail(),
                user.getRole()
        );

        return new AuthResult(token, user);
    }
}