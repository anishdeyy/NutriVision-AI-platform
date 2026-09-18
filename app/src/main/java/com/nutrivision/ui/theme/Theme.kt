package com.nutrivision.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// ─── Brand Colors ───────────────────────────────────────────────────────────
val NeonGreen      = Color(0xFF39FF8F)   // primary accent
val ElectricBlue   = Color(0xFF4FC3F7)   // secondary
val VibrantOrange  = Color(0xFFFF7043)   // calories highlight
val PurpleAccent   = Color(0xFFCE93D8)   // protein
val TealAccent     = Color(0xFF4DB6AC)   // carbs
val AmberAccent    = Color(0xFFFFCA28)   // fats

// ─── Backgrounds ────────────────────────────────────────────────────────────
val DarkBg         = Color(0xFF0A0E1A)   // deepest bg
val SurfaceDark    = Color(0xFF111827)   // cards
val SurfaceMed     = Color(0xFF1A2234)   // elevated
val SurfaceLight   = Color(0xFF243044)   // borders/dividers

// ─── Text ───────────────────────────────────────────────────────────────────
val TextPrimary    = Color(0xFFF1F5F9)
val TextSecondary  = Color(0xFF94A3B8)
val TextMuted      = Color(0xFF475569)

// ─── Gradient pairs ─────────────────────────────────────────────────────────
val GradientGreen  = listOf(Color(0xFF39FF8F), Color(0xFF00C853))
val GradientBlue   = listOf(Color(0xFF4FC3F7), Color(0xFF0288D1))
val GradientOrange = listOf(Color(0xFFFF7043), Color(0xFFE53935))

private val DarkColorScheme = darkColorScheme(
    primary            = NeonGreen,
    onPrimary          = Color(0xFF003319),
    primaryContainer   = Color(0xFF004D1A),
    onPrimaryContainer = NeonGreen,
    secondary          = ElectricBlue,
    onSecondary        = Color(0xFF00344A),
    secondaryContainer = Color(0xFF004C6A),
    onSecondaryContainer = ElectricBlue,
    tertiary           = VibrantOrange,
    background         = DarkBg,
    onBackground       = TextPrimary,
    surface            = SurfaceDark,
    onSurface          = TextPrimary,
    surfaceVariant     = SurfaceMed,
    onSurfaceVariant   = TextSecondary,
    outline            = SurfaceLight,
    error              = Color(0xFFEF5350),
)

@Composable
fun NutriVisionTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography  = NutriTypography,
        content     = content
    )
}
