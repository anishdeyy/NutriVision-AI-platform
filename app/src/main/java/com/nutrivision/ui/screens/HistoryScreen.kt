package com.nutrivision.ui.screens

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.*
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.nutrivision.ui.components.GlassCard
import com.nutrivision.ui.components.ShimmerBox
import com.nutrivision.ui.theme.*
import com.nutrivision.viewmodel.HistoryPoint
import com.nutrivision.viewmodel.HistoryViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HistoryScreen(
    navController: NavController,
    viewModel: HistoryViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        containerColor = DarkBg,
        topBar = {
            TopAppBar(
                title = { Text("History & Analytics", style = MaterialTheme.typography.titleLarge) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, null, tint = TextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBg)
            )
        }
    ) { pv ->
        if (uiState.isLoading) {
            Column(
                modifier = Modifier.fillMaxSize().padding(pv).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                repeat(3) { ShimmerBox(modifier = Modifier.fillMaxWidth().height(80.dp)) }
            }
            return@Scaffold
        }

        if (uiState.history.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize().padding(pv), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("📊", fontSize = 64.sp)
                    Spacer(Modifier.height(16.dp))
                    Text("No history yet", style = MaterialTheme.typography.headlineSmall.copy(color = TextSecondary))
                    Text("Start tracking meals to see your progress", style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted, textAlign = TextAlign.Center))
                }
            }
            return@Scaffold
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(pv)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // ── Calorie Trend Graph ────────────────────────────────────────────
            GlassCard(modifier = Modifier.fillMaxWidth()) {
                Text("🔥 Calorie Trend (30 days)", style = MaterialTheme.typography.titleMedium.copy(color = TextSecondary))
                Spacer(Modifier.height(16.dp))
                LineChart(
                    dataPoints = uiState.history.map { it.calories.toFloat() },
                    color      = VibrantOrange,
                    modifier   = Modifier.fillMaxWidth().height(160.dp)
                )
                Spacer(Modifier.height(8.dp))
                // X-axis labels (first & last date)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(uiState.history.firstOrNull()?.date?.takeLast(5) ?: "", style = MaterialTheme.typography.bodySmall.copy(color = TextMuted))
                    Text(uiState.history.lastOrNull()?.date?.takeLast(5) ?: "", style = MaterialTheme.typography.bodySmall.copy(color = TextMuted))
                }
            }

            // ── Protein Trend Graph ────────────────────────────────────────────
            GlassCard(modifier = Modifier.fillMaxWidth()) {
                Text("💪 Protein Trend (30 days)", style = MaterialTheme.typography.titleMedium.copy(color = TextSecondary))
                Spacer(Modifier.height(16.dp))
                LineChart(
                    dataPoints = uiState.history.map { it.protein.toFloat() },
                    color      = PurpleAccent,
                    modifier   = Modifier.fillMaxWidth().height(160.dp)
                )
            }

            // ── Summary Stats ─────────────────────────────────────────────────
            GlassCard(modifier = Modifier.fillMaxWidth()) {
                Text("📊 30-Day Summary", style = MaterialTheme.typography.titleMedium.copy(color = TextSecondary))
                Spacer(Modifier.height(16.dp))
                val avgCal  = uiState.history.map { it.calories }.average()
                val avgProt = uiState.history.map { it.protein }.average()
                val days    = uiState.history.size

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    SummaryStatItem("Days Tracked", "$days", ElectricBlue)
                    SummaryStatItem("Avg Calories", "${avgCal.toInt()}", VibrantOrange)
                    SummaryStatItem("Avg Protein", "${avgProt.toInt()}g", PurpleAccent)
                }
            }

            // ── Daily Log List ────────────────────────────────────────────────
            Text("📅 Daily Log", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))

            uiState.history.reversed().forEach { point ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(SurfaceDark, RoundedCornerShape(12.dp))
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            formatHistoryDate(point.date),
                            style = MaterialTheme.typography.bodyMedium.copy(color = TextPrimary, fontWeight = FontWeight.SemiBold)
                        )
                        Text(
                            "Protein: ${point.protein.toInt()}g",
                            style = MaterialTheme.typography.bodySmall.copy(color = PurpleAccent)
                        )
                    }
                    Text(
                        "${point.calories.toInt()} cal",
                        style = MaterialTheme.typography.titleMedium.copy(color = VibrantOrange, fontWeight = FontWeight.Bold)
                    )
                }
                Spacer(Modifier.height(6.dp))
            }
        }
    }
}

@Composable
private fun LineChart(
    dataPoints: List<Float>,
    color: Color,
    modifier: Modifier = Modifier
) {
    if (dataPoints.size < 2) return

    Canvas(modifier = modifier) {
        val maxVal  = dataPoints.max().coerceAtLeast(1f)
        val minVal  = dataPoints.min()
        val range   = (maxVal - minVal).coerceAtLeast(1f)
        val w       = size.width
        val h       = size.height
        val stepX   = w / (dataPoints.size - 1)

        // Gradient fill
        val path = Path().apply {
            dataPoints.forEachIndexed { i, v ->
                val x = i * stepX
                val y = h - ((v - minVal) / range * h * 0.9f) - h * 0.05f
                if (i == 0) moveTo(x, y) else lineTo(x, y)
            }
            // Close path for gradient fill
            lineTo((dataPoints.size - 1) * stepX, h)
            lineTo(0f, h)
            close()
        }
        drawPath(
            path  = path,
            brush = Brush.verticalGradient(
                colors = listOf(color.copy(alpha = 0.4f), Color.Transparent)
            )
        )

        // Line
        val linePath = Path().apply {
            dataPoints.forEachIndexed { i, v ->
                val x = i * stepX
                val y = h - ((v - minVal) / range * h * 0.9f) - h * 0.05f
                if (i == 0) moveTo(x, y) else lineTo(x, y)
            }
        }
        drawPath(linePath, color = color, style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round))

        // Dot at last point
        val lastX = (dataPoints.size - 1) * stepX
        val lastY = h - ((dataPoints.last() - minVal) / range * h * 0.9f) - h * 0.05f
        drawCircle(color = color, radius = 6.dp.toPx(), center = Offset(lastX, lastY))
        drawCircle(color = Color.White, radius = 3.dp.toPx(), center = Offset(lastX, lastY))
    }
}

@Composable
private fun SummaryStatItem(label: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, style = MaterialTheme.typography.headlineSmall.copy(color = color, fontWeight = FontWeight.Black))
        Text(label, style = MaterialTheme.typography.bodySmall.copy(color = TextMuted))
    }
}

private fun formatHistoryDate(dateStr: String): String = try {
    val date = java.time.LocalDate.parse(dateStr)
    date.format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy"))
} catch (e: Exception) { dateStr }
