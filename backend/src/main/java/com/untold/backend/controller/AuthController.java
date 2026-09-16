package com.untold.backend.controller;

import com.untold.backend.dto.request.LoginRequest;
import com.untold.backend.dto.request.RegisterRequest;
import com.untold.backend.dto.response.ApiResponse;
import com.untold.backend.dto.response.AuthResponse;
import com.untold.backend.dto.UserDto;
import com.untold.backend.model.User;
import com.untold.backend.model.UserType;
import com.untold.backend.service.AuthService;
import com.untold.backend.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider tokenProvider;

    public AuthController(AuthService authService, JwtTokenProvider tokenProvider) {
        this.authService = authService;
        this.tokenProvider = tokenProvider;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@RequestBody RegisterRequest request) {
        try {
            User user = new User();
            user.setUsername(request.getUsername());
            user.setEmail(request.getEmail());
            user.setPassword(request.getPassword());
            user.setUserType(UserType.valueOf(request.getUserType()));

            User createdUser = authService.register(user);

            String token = tokenProvider.generateToken(
                new UsernamePasswordAuthenticationToken(createdUser.getEmail(), null, new ArrayList<>())
            );

            UserDto userDto = UserDto.builder()
                    .id(createdUser.getId())
                    .username(createdUser.getUsername())
                    .email(createdUser.getEmail())
                    .userType(createdUser.getUserType())
                    .build();

            AuthResponse authResponse = AuthResponse.builder()
                    .token(token)
                    .user(userDto)
                    .build();

            return ResponseEntity.ok(ApiResponse.success("Registration successful", authResponse));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody LoginRequest request) {
        try {
            User user = authService.authenticate(request.getEmail(), request.getPassword());
            return ResponseEntity.ok(ApiResponse.success("Login successful", buildAuthResponse(user)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.unauthorized("Invalid credentials"));
        }
    }

    @PostMapping("/admin-login")
    public ResponseEntity<ApiResponse<AuthResponse>> adminLogin(@RequestBody LoginRequest request) {
        try {
            User user = authService.authenticate(request.getEmail(), request.getPassword());

            if (user.getUserType() != UserType.ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Acces interzis. Doar administratorii se pot autentifica în această aplicație."));
            }

            return ResponseEntity.ok(ApiResponse.success("Login successful", buildAuthResponse(user)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.unauthorized("Invalid credentials"));
        }
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = tokenProvider.generateToken(
            new UsernamePasswordAuthenticationToken(user.getEmail(), null, new ArrayList<>())
        );

        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .userType(user.getUserType())
                .build();

        return AuthResponse.builder()
                .token(token)
                .user(userDto)
                .build();
    }
}
