package com.example.admin_app

import android.Manifest
import android.content.Context
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.OptIn
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.lifecycleScope
import com.google.mlkit.vision.barcode.BarcodeScanner
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.sse.EventSource
import okhttp3.sse.EventSourceListener
import okhttp3.sse.EventSources
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

// ==========================================
// 1. RETROFIT API & DATA MODELS
// ==========================================

interface UntoldAdminApi {
    @POST("api/auth/admin-login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<AuthResponse>>

    @POST("api/tickets/validate-qr")
    suspend fun validateQr(
        @Header("Authorization") authorization: String,
        @Body request: QrRequest
    ): Response<QrValidationResponse>

    @GET("api/tickets/stats/entrances-today")
    suspend fun getTodayEntranceStats(
        @Header("Authorization") authorization: String
    ): Response<EntranceStatsResponse>
}

data class LoginRequest(val email: String, val password: String)

data class ApiResponse<T>(
    val type: String?,
    val message: String?,
    val data: T?
)

data class AuthResponse(
    val token: String?,
    val user: UserResponse?
)

data class AdminSession(val username: String, val token: String)

data class UserResponse(
    val id: Long,
    val username: String,
    val email: String,
    val userType: String
)

enum class ScanDirection { IN, OUT }

data class QrRequest(val qrCode: String, val direction: String)

data class QrValidationResponse(
    val success: Boolean,
    val message: String,
    val attendeeName: String?,
    val ticketType: String?
)

data class EntranceStatsResponse(
    val entriesToday: Long
)

object RetrofitClient {
    // 10.0.2.2 is the Android Emulator loopback mapping to host's localhost (Spring Boot on port 8080)
    private const val BASE_URL = "http://10.0.2.2:8080/"

    val api: UntoldAdminApi by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(UntoldAdminApi::class.java)
    }
}

// ==========================================
// 2. STATE MANAGER & MAIN ACTIVITY
// ==========================================

sealed class ScannerState {
    object Idle : ScannerState()
    data class Validating(val qrCode: String) : ScannerState()
    data class Success(val title: String, val name: String, val ticketType: String) : ScannerState()
    data class Failure(val message: String) : ScannerState()
}

class MainActivity : ComponentActivity() {

    private lateinit var sharedPreferences: SharedPreferences
    private lateinit var cameraExecutor: ExecutorService

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        sharedPreferences = getSharedPreferences("UntoldAdminPrefs", Context.MODE_PRIVATE)
        cameraExecutor = Executors.newSingleThreadExecutor()

        setContent {
            UntoldTheme {
                MainNavigation(sharedPreferences, cameraExecutor)
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }
}

// ==========================================
// 3. UI COMPONENTS & THEMING
// ==========================================

@Composable
fun UntoldTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Color(0xFFD01C90),      // Electric Neon Pink
            secondary = Color(0xFF6C11A3),    // Magic Violet
            background = Color(0xFF040012),   // Untold Deep Dark
            surface = Color(0xFF130138),      // Glowing Dark Purple
            onBackground = Color.White,
            onSurface = Color.White
        ),
        content = content
    )
}

val UntoldGradient = Brush.linearGradient(
    colors = listOf(Color(0xFF6C11A3), Color(0xFF130138), Color(0xFF040012))
)

private enum class AdminScreen { SCANNER, STATS }

private fun authenticationErrorMessage(status: Int?): String? = when (status) {
    401 -> "Sesiunea a expirat sau nu mai este validă. Autentificați-vă din nou."
    403 -> "Acces interzis. Autentificați-vă din nou cu un cont de administrator."
    else -> null
}

@Composable
fun MainNavigation(sharedPreferences: SharedPreferences, cameraExecutor: ExecutorService) {
    var session by remember {
        val username = sharedPreferences.getString("admin_user", null)
        val token = sharedPreferences.getString("admin_token", null)
        mutableStateOf(
            if (username.isNullOrBlank() || token.isNullOrBlank()) null
            else AdminSession(username, token)
        )
    }
    var loginMessage by remember { mutableStateOf<String?>(null) }
    var currentScreen by remember { mutableStateOf(AdminScreen.SCANNER) }
    val endSession: (String?) -> Unit = { message ->
        sharedPreferences.edit().remove("admin_user").remove("admin_token").apply()
        session = null
        currentScreen = AdminScreen.SCANNER
        loginMessage = message
    }
    val activeSession = session

    if (activeSession == null) {
        AdminLoginScreen(
            sessionMessage = loginMessage,
            onLoginSuccess = { authenticatedSession ->
                sharedPreferences.edit()
                    .putString("admin_user", authenticatedSession.username)
                    .putString("admin_token", authenticatedSession.token)
                    .apply()
                loginMessage = null
                currentScreen = AdminScreen.SCANNER
                session = authenticatedSession
            }
        )
    } else if (currentScreen == AdminScreen.STATS) {
        AdminStatsScreen(
            authToken = activeSession.token,
            onAuthenticationFailed = { endSession(it) },
            onBack = { currentScreen = AdminScreen.SCANNER }
        )
    } else {
        AdminScannerScreen(
            adminName = activeSession.username,
            authToken = activeSession.token,
            cameraExecutor = cameraExecutor,
            onShowStats = { currentScreen = AdminScreen.STATS },
            onAuthenticationFailed = { endSession(it) },
            onLogout = { endSession(null) }
        )
    }
}

// ==========================================
// 4. SCREEN 1: ADMIN LOGIN SCREEN
// ==========================================

@Composable
fun AdminLoginScreen(sessionMessage: String?, onLoginSuccess: (AdminSession) -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember(sessionMessage) { mutableStateOf(sessionMessage) }
    
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(UntoldGradient),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .padding(16.dp)
                .border(1.dp, Color(0xFFD01C90).copy(alpha = 0.3f), RoundedCornerShape(24.dp)),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF130138).copy(alpha = 0.85f)),
            shape = RoundedCornerShape(24.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Untold Logo Placeholder
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(RoundedCornerShape(40.dp))
                        .background(Color(0xFFD01C90).copy(alpha = 0.15f))
                        .border(2.dp, Color(0xFFD01C90), RoundedCornerShape(40.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "U",
                        fontSize = 42.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFD01C90)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "UNTOLD ACCESS",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White,
                    letterSpacing = 2.sp
                )
                Text(
                    text = "ADMIN PORTAL",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color(0xFFD01C90),
                    letterSpacing = 4.sp
                )

                Spacer(modifier = Modifier.height(24.dp))

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Admin Email", color = Color.White.copy(alpha = 0.6f)) },
                    leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = Color(0xFFD01C90)) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color(0xFFD01C90),
                        unfocusedBorderColor = Color.White.copy(alpha = 0.3f)
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password", color = Color.White.copy(alpha = 0.6f)) },
                    leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = Color(0xFFD01C90)) },
                    visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    trailingIcon = {
                        IconButton(onClick = { passwordVisible = !passwordVisible }) {
                            Text(
                                text = if (passwordVisible) "HIDE" else "SHOW",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFD01C90)
                            )
                        }
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color(0xFFD01C90),
                        unfocusedBorderColor = Color.White.copy(alpha = 0.3f)
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
                )

                Spacer(modifier = Modifier.height(24.dp))

                if (errorMessage != null) {
                    Text(
                        text = errorMessage!!,
                        color = Color.Red,
                        fontSize = 14.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                }

                Button(
                    onClick = {
                        if (email.isBlank() || password.isBlank()) {
                            errorMessage = "Completați ambele câmpuri."
                            return@Button
                        }
                        isLoading = true
                        errorMessage = null
                        coroutineScope.launch {
                            try {
                                val response = withContext(Dispatchers.IO) {
                                    RetrofitClient.api.login(LoginRequest(email, password))
                                }
                                if (response.isSuccessful) {
                                    val result = response.body()
                                    val user = result?.data?.user
                                    val token = result?.data?.token
                                    if (result?.type == "SUCCESS" && user != null && !token.isNullOrBlank()) {
                                        if (user.userType == "ADMIN") {
                                            onLoginSuccess(AdminSession(user.username, token))
                                        } else {
                                            errorMessage = "Acces interzis. Doar administratorii au acces."
                                        }
                                    } else {
                                        errorMessage = "Serverul nu a returnat o sesiune validă. Autentificați-vă din nou."
                                    }
                                } else if (response.code() == 403) {
                                    errorMessage = "Acces interzis. Doar administratorii au acces."
                                } else {
                                    errorMessage = "Date de logare incorecte sau server offline."
                                }
                            } catch (e: CancellationException) {
                                throw e
                            } catch (e: Exception) {
                                Log.e("LoginError", "Request failed", e)
                                errorMessage = "Eroare de rețea. Verificați conexiunea."
                            } finally {
                                isLoading = false
                            }
                        }
                    },
                    enabled = !isLoading,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD01C90)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                    } else {
                        Text("LOGIN", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

// ==========================================
// 5. SCREEN 2: CAMERA scanner SCREEN
// ==========================================

@Composable
fun AdminScannerScreen(
    adminName: String,
    authToken: String,
    cameraExecutor: ExecutorService,
    onShowStats: () -> Unit,
    onAuthenticationFailed: (String) -> Unit,
    onLogout: () -> Unit
) {
    var scannerState by remember { mutableStateOf<ScannerState>(ScannerState.Idle) }
    var direction by remember { mutableStateOf(ScanDirection.IN) }
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val coroutineScope = rememberCoroutineScope()

    // Animation values for QR flashing/pulse on validation results
    val transition = rememberInfiniteTransition(label = "flash")
    val borderAlpha by transition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(600, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ), label = "flashAlpha"
    )

    Box(modifier = Modifier.fillMaxSize()) {
        // CameraX Preview View
        CameraPreview(
            executor = cameraExecutor,
            lifecycleOwner = lifecycleOwner,
            scannerState = scannerState,
            onQrDetected = { rfid ->
                if (scannerState is ScannerState.Idle) {
                    scannerState = ScannerState.Validating(rfid)
                    val scanDirection = direction
                    coroutineScope.launch {
                        try {
                            val response = withContext(Dispatchers.IO) {
                                RetrofitClient.api.validateQr(
                                    "Bearer $authToken",
                                    QrRequest(rfid, scanDirection.name)
                                )
                            }
                            val authenticationError = authenticationErrorMessage(response.code())
                            if (authenticationError != null) {
                                onAuthenticationFailed(authenticationError)
                            } else if (response.isSuccessful) {
                                val validation = response.body()
                                if (validation != null && validation.success) {
                                    scannerState = ScannerState.Success(
                                        title = validation.message,
                                        name = validation.attendeeName ?: "Participant",
                                        ticketType = validation.ticketType ?: "Bilet Standard"
                                    )
                                } else {
                                    scannerState = ScannerState.Failure(
                                        message = validation?.message ?: "Eroare validare"
                                    )
                                }
                            } else {
                                scannerState = ScannerState.Failure(
                                    message = "Eroare server (HTTP ${response.code()}). Încercați din nou."
                                )
                            }
                        } catch (e: CancellationException) {
                            throw e
                        } catch (e: Exception) {
                            Log.e("ScannerError", "Verification failed", e)
                            scannerState = ScannerState.Failure(message = "Eroare conexiune server")
                        }
                    }
                }
            }
        )

        // Untold Cyber Reticle / Scanner HUD Overlay
        ScannerHudOverlay(scannerState = scannerState, borderAlpha = borderAlpha)

        // Floating Header with admin info
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(16.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Color(0xFF040012).copy(alpha = 0.7f))
                .border(0.5.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(16.dp))
                .padding(horizontal = 16.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Operator",
                    fontSize = 11.sp,
                    color = Color.White.copy(alpha = 0.6f),
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = adminName,
                    fontSize = 15.sp,
                    color = Color.White,
                    fontWeight = FontWeight.ExtraBold
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                IconButton(
                    onClick = onShowStats,
                    modifier = Modifier
                        .size(36.dp)
                        .background(Color(0xFFD01C90).copy(alpha = 0.2f), RoundedCornerShape(10.dp))
                ) {
                    Text("STATS", fontSize = 9.sp, fontWeight = FontWeight.Black, color = Color(0xFFD01C90))
                }
                IconButton(
                    onClick = onLogout,
                    modifier = Modifier
                        .size(36.dp)
                        .background(Color.Red.copy(alpha = 0.2f), RoundedCornerShape(10.dp))
                ) {
                    Text("LOGOUT", fontSize = 9.sp, fontWeight = FontWeight.Black, color = Color.Red)
                }
            }
        }

        // IN / OUT mode toggle
        Row(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .statusBarsPadding()
                .padding(top = 72.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(Color(0xFF040012).copy(alpha = 0.85f))
                .border(0.5.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(14.dp))
                .padding(4.dp)
        ) {
            listOf(ScanDirection.IN to "INTRARE", ScanDirection.OUT to "IEȘIRE").forEach { (dir, label) ->
                val selected = direction == dir
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (selected) Color(0xFFD01C90) else Color.Transparent)
                        .clickable { direction = dir }
                        .padding(horizontal = 20.dp, vertical = 10.dp)
                ) {
                    Text(
                        text = label,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Black,
                        color = if (selected) Color.White else Color.White.copy(alpha = 0.5f)
                    )
                }
            }
        }

        // Bottom State-Based Overlay (Sliding Bottom Card)
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .navigationBarsPadding()
                .padding(16.dp)
        ) {
            ScannerBottomCard(
                state = scannerState,
                onScanNext = { scannerState = ScannerState.Idle }
            )
        }
    }
}

// ==========================================
// 5b. SCREEN 3: LIVE ENTRANCE STATS SCREEN
// ==========================================

private const val SSE_RECONNECT_DELAY_MS = 5_000L

@Composable
fun AdminStatsScreen(
    authToken: String,
    onAuthenticationFailed: (String) -> Unit,
    onBack: () -> Unit
) {
    var entriesToday by remember { mutableStateOf<Long?>(null) }
    var connected by remember { mutableStateOf(false) }
    // Bumping this re-runs the DisposableEffect below, i.e. opens a fresh SSE connection.
    var connectionAttempt by remember { mutableStateOf(0) }
    val coroutineScope = rememberCoroutineScope()
    val currentOnAuthenticationFailed by rememberUpdatedState(onAuthenticationFailed)

    // Live stream: the backend pushes a Server-Sent-Event (fed by Kafka) on every gate scan, so
    // the number updates the instant someone enters or leaves — no polling interval.
    DisposableEffect(authToken, connectionAttempt) {
        val disposed = AtomicBoolean(false)
        val reconnectScheduled = AtomicBoolean(false)
        val client = OkHttpClient.Builder()
            .readTimeout(0, java.util.concurrent.TimeUnit.MILLISECONDS) // SSE stays open indefinitely
            .build()
        val request = okhttp3.Request.Builder()
            .url("http://10.0.2.2:8080/api/stream/entrance-stats")
            .header("Accept", "text/event-stream")
            .header("Authorization", "Bearer $authToken")
            .build()

        fun reconnect() {
            if (disposed.get() || !reconnectScheduled.compareAndSet(false, true)) return
            coroutineScope.launch {
                if (disposed.get()) return@launch
                connected = false
                delay(SSE_RECONNECT_DELAY_MS)
                if (!disposed.get()) connectionAttempt++
            }
        }

        val eventSource = EventSources.createFactory(client).newEventSource(request, object : EventSourceListener() {
            override fun onOpen(eventSource: EventSource, response: okhttp3.Response) {
                coroutineScope.launch {
                    if (!disposed.get()) connected = true
                }
            }

            override fun onEvent(eventSource: EventSource, id: String?, type: String?, data: String) {
                Regex("\"entriesInside\"\\s*:\\s*(-?\\d+)").find(data)
                    ?.groupValues?.get(1)?.toLongOrNull()
                    ?.let { count ->
                        coroutineScope.launch {
                            if (!disposed.get()) entriesToday = count
                        }
                    }
            }

            override fun onFailure(eventSource: EventSource, t: Throwable?, response: okhttp3.Response?) {
                Log.e("StatsSSE", "Entrance stats stream failed", t)
                val authenticationError = authenticationErrorMessage(response?.code)
                if (authenticationError != null) {
                    reconnectScheduled.set(true)
                    coroutineScope.launch {
                        if (!disposed.get()) {
                            connected = false
                            disposed.set(true)
                            currentOnAuthenticationFailed(authenticationError)
                        }
                    }
                } else {
                    reconnect()
                }
            }

            override fun onClosed(eventSource: EventSource) {
                reconnect()
            }
        })

        onDispose {
            disposed.set(true)
            eventSource.cancel()
            client.dispatcher.executorService.shutdown()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(UntoldGradient)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "LIVE STATISTICS",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White,
                    letterSpacing = 2.sp
                )
                IconButton(
                    onClick = onBack,
                    modifier = Modifier
                        .size(36.dp)
                        .background(Color.White.copy(alpha = 0.1f), RoundedCornerShape(10.dp))
                ) {
                    Text("BACK", fontSize = 9.sp, fontWeight = FontWeight.Black, color = Color.White)
                }
            }

            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth(0.9f)
                        .border(1.dp, Color(0xFFD01C90).copy(alpha = 0.4f), RoundedCornerShape(24.dp)),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF130138).copy(alpha = 0.85f)),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "PERSOANE ÎN FESTIVAL ACUM",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White.copy(alpha = 0.6f),
                            letterSpacing = 1.5.sp
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        if (entriesToday == null) {
                            CircularProgressIndicator(color = Color(0xFFD01C90))
                        } else {
                            Text(
                                text = entriesToday.toString(),
                                fontSize = 64.sp,
                                fontWeight = FontWeight.Black,
                                color = Color(0xFFD01C90)
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .background(
                                        if (connected) Color(0xFF4CAF50) else Color.Red,
                                        RoundedCornerShape(4.dp)
                                    )
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = if (connected) "LIVE — actualizare instantă la fiecare scanare"
                                       else "Reconectare la fluxul live...",
                                fontSize = 10.sp,
                                color = Color.White.copy(alpha = 0.4f),
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CameraPreview(
    executor: ExecutorService,
    lifecycleOwner: LifecycleOwner,
    scannerState: ScannerState,
    onQrDetected: (String) -> Unit
) {
    val context = LocalContext.current
    val previewView = remember { PreviewView(context) }

    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        )
    }
    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted -> hasCameraPermission = granted }

    LaunchedEffect(Unit) {
        if (!hasCameraPermission) {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    val options = BarcodeScannerOptions.Builder()
        .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
        .build()
    val scanner = remember { BarcodeScanning.getClient(options) }

    LaunchedEffect(lifecycleOwner, hasCameraPermission) {
        if (!hasCameraPermission) return@LaunchedEffect
        val cameraProviderProvider = ProcessCameraProvider.getInstance(context)
        cameraProviderProvider.addListener({
            val cameraProvider = cameraProviderProvider.get()

            val preview = Preview.Builder().build().apply {
                setSurfaceProvider(previewView.surfaceProvider)
            }

            val imageAnalysis = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()

            imageAnalysis.setAnalyzer(executor) { imageProxy ->
                // Throttle / pause scanning if we are not in the Idle state
                if (scannerState !is ScannerState.Idle) {
                    imageProxy.close()
                    return@setAnalyzer
                }
                processImageProxy(imageProxy, scanner, onQrDetected)
            }

            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    lifecycleOwner,
                    CameraSelector.DEFAULT_BACK_CAMERA,
                    preview,
                    imageAnalysis
                )
            } catch (e: Exception) {
                Log.e("CameraPreview", "Camera binding failed", e)
            }
        }, ContextCompat.getMainExecutor(context))
    }

    if (hasCameraPermission) {
        AndroidView(
            factory = { previewView },
            modifier = Modifier.fillMaxSize()
        )
    } else {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "Este necesar accesul la cameră pentru scanare.",
                color = Color.White,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(32.dp)
            )
        }
    }
}

@OptIn(ExperimentalGetImage::class)
private fun processImageProxy(
    imageProxy: ImageProxy,
    scanner: BarcodeScanner,
    onQrDetected: (String) -> Unit
) {
    val mediaImage = imageProxy.image
    if (mediaImage != null) {
        val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
        scanner.process(image)
            .addOnSuccessListener { barcodes ->
                for (barcode in barcodes) {
                    val rawValue = barcode.rawValue
                    if (rawValue != null) {
                        onQrDetected(rawValue)
                        break
                    }
                }
            }
            .addOnFailureListener {
                Log.e("BarcodeAnalyzer", "ML Kit processing failed", it)
            }
            .addOnCompleteListener {
                imageProxy.close()
            }
    } else {
        imageProxy.close()
    }
}

@Composable
fun ScannerHudOverlay(scannerState: ScannerState, borderAlpha: Float) {
    val boxColor = when (scannerState) {
        is ScannerState.Success -> Color.Green
        is ScannerState.Failure -> Color.Red.copy(alpha = borderAlpha)
        is ScannerState.Validating -> Color(0xFFD01C90).copy(alpha = borderAlpha)
        else -> Color.White.copy(alpha = 0.5f)
    }

    val reticleAnimation = rememberInfiniteTransition(label = "reticleLine")
    val reticleOffset by reticleAnimation.animateFloat(
        initialValue = 0.0f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ), label = "lineOffset"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .drawBehind {
                val canvasWidth = size.width
                val canvasHeight = size.height
                val boxWidth = 240.dp.toPx()
                val boxHeight = 240.dp.toPx()
                val left = (canvasWidth - boxWidth) / 2
                val top = (canvasHeight - boxHeight) / 2

                // Draw dark scrim around reticle box
                drawRect(
                    color = Color.Black.copy(alpha = 0.55f),
                    size = Size(canvasWidth, canvasHeight)
                )

                // Clear reticle viewport
                drawRoundRect(
                    color = Color.Transparent,
                    topLeft = Offset(left, top),
                    size = Size(boxWidth, boxHeight),
                    cornerRadius = CornerRadius(24.dp.toPx()),
                    blendMode = androidx.compose.ui.graphics.BlendMode.Clear
                )

                // Draw reticle framing borders
                drawRoundRect(
                    color = boxColor,
                    topLeft = Offset(left, top),
                    size = Size(boxWidth, boxHeight),
                    cornerRadius = CornerRadius(24.dp.toPx()),
                    style = Stroke(width = 3.dp.toPx())
                )

                // Render vertical scanning laser line if scanner is idle/validating
                if (scannerState is ScannerState.Idle || scannerState is ScannerState.Validating) {
                    val laserY = top + (boxHeight * reticleOffset)
                    drawRect(
                        brush = Brush.verticalGradient(
                            colors = listOf(
                                Color(0xFFD01C90).copy(alpha = 0.1f),
                                Color(0xFFD01C90),
                                Color(0xFFD01C90).copy(alpha = 0.1f)
                            )
                        ),
                        topLeft = Offset(left + 8.dp.toPx(), laserY - 1.dp.toPx()),
                        size = Size(boxWidth - 16.dp.toPx(), 3.dp.toPx())
                    )
                }
            }
    )
}

@Composable
fun ScannerBottomCard(state: ScannerState, onScanNext: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(
                border = BorderStroke(
                    1.dp,
                    when (state) {
                        is ScannerState.Success -> Color.Green.copy(alpha = 0.6f)
                        is ScannerState.Failure -> Color.Red.copy(alpha = 0.6f)
                        else -> Color.White.copy(alpha = 0.15f)
                    }
                ),
                shape = RoundedCornerShape(20.dp)
            ),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF130138).copy(alpha = 0.9f)),
        shape = RoundedCornerShape(20.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            when (state) {
                is ScannerState.Idle -> {
                    Text(
                        text = "READY TO SCAN",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = "Aliniați codul QR de pe biletul Untold în cadru pentru validare.",
                        fontSize = 13.sp,
                        color = Color.White.copy(alpha = 0.6f),
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 6.dp)
                    )
                }
                is ScannerState.Validating -> {
                    CircularProgressIndicator(
                        color = Color(0xFFD01C90),
                        modifier = Modifier
                            .size(36.dp)
                            .padding(bottom = 12.dp)
                    )
                    Text(
                        text = "SE VERIFICĂ... [${state.qrCode.take(12)}...]",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
                is ScannerState.Success -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFF0F5A2F)) // Deep success green
                            .border(1.dp, Color.Green, RoundedCornerShape(12.dp))
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "✓ ${state.title}",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.Green,
                                letterSpacing = 1.sp
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = state.name,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = state.ticketType,
                                fontSize = 13.sp,
                                color = Color.White.copy(alpha = 0.8f),
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = onScanNext,
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Green),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth().height(44.dp)
                    ) {
                        Text("SCAN NEXT", fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = Color.Black)
                    }
                }
                is ScannerState.Failure -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFF6B1B1B)) // Deep alert red
                            .border(1.dp, Color.Red, RoundedCornerShape(12.dp))
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "✕ ACCESS DENIED",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.Red,
                                letterSpacing = 1.sp
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = state.message,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = onScanNext,
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Red),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth().height(44.dp)
                    ) {
                        Text("TRY AGAIN / SCAN NEXT", fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                    }
                }
            }
        }
    }
}
