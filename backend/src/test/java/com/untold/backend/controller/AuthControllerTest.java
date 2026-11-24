package com.untold.backend.controller;

import com.untold.backend.model.User;
import com.untold.backend.model.UserType;
import com.untold.backend.security.JwtTokenProvider;
import com.untold.backend.service.AuthService;
import com.untold.backend.dto.request.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private JwtTokenProvider tokenProvider;

    @InjectMocks
    private AuthController authController;

    @Test
    void registrationAlwaysCreatesAttendeeRegardlessOfSubmittedRole() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("mobile-user");
        request.setEmail("mobile@example.com");
        request.setPassword("password");
        request.setUserType("ADMIN");

        when(authService.register(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(tokenProvider.generateToken(any())).thenReturn("signed-token");

        authController.register(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(authService).register(userCaptor.capture());
        assertEquals(UserType.ATTENDEE, userCaptor.getValue().getUserType());
    }
}
