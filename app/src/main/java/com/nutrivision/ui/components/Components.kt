package com.nutrivision.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.draw.*
import androidx.compose.ui.geometry.*
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.*
import com.nutrivision.data.FoodLogEntity
import com.nutrivision.ui.theme.*
import kotlin.math.cos
import kotlin.math.sin

// ─── Gradient Card ────────────────────────────────────────────────────────────

@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        border = BorderStroke(1.dp, SurfaceLight),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        content = { Column(modifier = Modifier.padding(16.dp), content = content) }
    )
}

// ─── Circular Progress (Calories) ─────────────────────────────────────────────

@Composable
fun CircularCalorieProgress(
    consumed: Double,
    goal: Int,
    modifier: Modifier = Modifier
) {
    val progress = (consumed / goal).coerceIn(0.0, 1.0).toFloat()
    val animProgress by animateFloatAsState(
        targetValue = progress,
        animationSpec = tween(1000, easing = EaseOutCubic),
        label = "calories_progress"
    )

    Box(
        modifier = modifier.size(160.dp),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val strokeWidth = 14.dp.toPx()
            val radius = (size.minDimension - strokeWidth) / 2
            val center = Offset(size.width / 2, size.height / 2)

            // Background arc
            drawArc(
                color       = SurfaceLight,
                startAngle  = 135f,
                sweepAngle  = 270f,
                useCenter   = false,
                style       = Stroke(strokeWidth, cap = StrokeCap.Round)
            )

            // Gradient progress arc
            val brush = Brush.sweepGradient(
                colors = listOf(NeonGreen, ElectricBlue, NeonGreen)
            )
            drawArc(
                brush       = brush,
                startAngle  = 135f,
                sweepAngle  = 270f * animProgress,
                useCenter   = false,
                style       = Stroke(strokeWidth, cap = StrokeCap.Round)
            )
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text       = "${consumed.toInt()}",
                style      = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.Black,
                    color      = TextPrimary
                )
            )
            Text("cal", style = MaterialTheme.typography.bodySmall.copy(color = TextSecondary))
            Text(
                text  = "of $goal",
                style = MaterialTheme.typography.bodySmall.copy(color = TextMuted)
            )
        }
    }
}

// ─── Macro Progress Bar ───────────────────────────────────────────────────────

@Composable
fun MacroBar(
    label: String,
    current: Double,
    goal: Int,
    color: Color,
    modifier: Modifier = Modifier
) {
    val progress = (current / goal).coerceIn(0.0, 1.0).toFloat()
    val animProg by animateFloatAsState(
        targetValue  = progress,
        animationSpec = tween(800, easing = EaseOutCubic),
        label        = "macro_$label"
    )

    Column(modifier = modifier) {
        Row(
            modifier           = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment  = Alignment.CenterVertically
        ) {
            Text(label, style = MaterialTheme.typography.bodyMedium)
            Text(
                text  = "${current.toInt()}g / ${goal}g",
                style = MaterialTheme.typography.bodySmall.copy(color = color)
            )
        }
        Spacer(Modifier.height(6.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(CircleShape)
                .background(SurfaceLight)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(animProg)
                    .fillMaxHeight()
                    .clip(CircleShape)
                    .background(
                        Brush.horizontalGradient(listOf(color, color.copy(alpha = 0.7f)))
                    )
            )
        }
    }
}

// ─── Meal Section Card ────────────────────────────────────────────────────────

@Composable
fun MealCard(
    mealType: String,
    logs: List<FoodLogEntity>,
    onAddClick: () -> Unit,
    onDeleteLog: (FoodLogEntity) -> Unit,
    modifier: Modifier = Modifier
) {
    val icon = when (mealType) {
        "Breakfast" -> Icons.Default.WbSunny
        "Lunch"     -> Icons.Default.LunchDining
        "Dinner"    -> Icons.Default.NightlightRound
        else        -> Icons.Default.EmojiFoodBeverage
    }
    val totalCals = logs.sumOf { it.calories }

    GlassCard(modifier = modifier.fillMaxWidth()) {
        Row(
            modifier           = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment  = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(icon, contentDescription = null, tint = NeonGreen, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(8.dp))
                Text(mealType, style = MaterialTheme.typography.titleMedium)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (totalCals > 0) {
                    Text(
                        "${totalCals.toInt()} cal",
                        style = MaterialTheme.typography.bodySmall.copy(color = VibrantOrange)
                    )
                    Spacer(Modifier.width(8.dp))
                }
                IconButton(onClick = onAddClick, modifier = Modifier.size(32.dp)) {
                    Icon(
                        Icons.Default.Add,
                        contentDescription = "Add $mealType",
                        tint   = NeonGreen,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }

        if (logs.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            logs.forEach { log ->
                FoodLogItem(log = log, onDelete = { onDeleteLog(log) })
                Spacer(Modifier.height(4.dp))
            }
        } else {
            Spacer(Modifier.height(8.dp))
            Text(
                "No items logged",
                style = MaterialTheme.typography.bodySmall.copy(color = TextMuted)
            )
        }
    }
}

// ─── Food Log Row ─────────────────────────────────────────────────────────────

@Composable
fun FoodLogItem(
    log: FoodLogEntity,
    onDelete: () -> Unit
) {
    Row(
        modifier          = Modifier
            .fillMaxWidth()
            .background(SurfaceMed, RoundedCornerShape(10.dp))
            .padding(horizontal = 12.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment     = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                log.foodName,
                style    = MaterialTheme.typography.bodyMedium.copy(color = TextPrimary),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                "${log.quantity.toInt()}g  •  P ${log.protein.toInt()}g  •  C ${log.carbs.toInt()}g  •  F ${log.fat.toInt()}g",
                style = MaterialTheme.typography.bodySmall
            )
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(
                "${log.calories.toInt()} cal",
                style = MaterialTheme.typography.bodyMedium.copy(color = VibrantOrange, fontWeight = FontWeight.SemiBold)
            )
            IconButton(onClick = onDelete, modifier = Modifier.size(24.dp)) {
                Icon(Icons.Default.Close, contentDescription = "Delete", tint = TextMuted, modifier = Modifier.size(16.dp))
            }
        }
    }
}

// ─── Recommendation Chip ──────────────────────────────────────────────────────

@Composable
fun RecommendationCard(text: String, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(
                Brush.horizontalGradient(listOf(SurfaceMed, SurfaceLight)),
                RoundedCornerShape(12.dp)
            )
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text  = text,
            style = MaterialTheme.typography.bodyMedium.copy(color = TextPrimary),
            modifier = Modifier.weight(1f)
        )
    }
}

// ─── Gradient Button ──────────────────────────────────────────────────────────

@Composable
fun GradientButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    Box(
        modifier = modifier
            .height(54.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(
                if (enabled)
                    Brush.horizontalGradient(GradientGreen)
                else
                    Brush.horizontalGradient(listOf(TextMuted, TextMuted))
            )
            .clickable(enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text  = text,
            style = MaterialTheme.typography.labelLarge.copy(color = Color(0xFF003319)),
            fontWeight = FontWeight.Bold
        )
    }
}

// ─── Week Calendar Strip ──────────────────────────────────────────────────────

@Composable
fun WeekStrip(
    selectedDate: String,
    onDateSelected: (String) -> Unit
) {
    val today = java.time.LocalDate.now()
    val days  = (-3..3).map { today.plusDays(it.toLong()) }

    Row(
        modifier              = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        days.forEach { day ->
            val dateStr  = day.toString()
            val isSelected = dateStr == selectedDate
            val isToday    = day == today

            Column(
                modifier = Modifier
                    .padding(4.dp)
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(
                        when {
                            isSelected -> NeonGreen
                            isToday    -> SurfaceMed
                            else       -> Color.Transparent
                        }
                    )
                    .clickable { onDateSelected(dateStr) },
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text  = day.dayOfWeek.name.take(1),
                    style = MaterialTheme.typography.bodySmall.copy(
                        color = if (isSelected) Color(0xFF003319) else TextMuted,
                        fontWeight = FontWeight.Bold
                    )
                )
                Text(
                    text  = day.dayOfMonth.toString(),
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color      = if (isSelected) Color(0xFF003319) else TextPrimary,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                    )
                )
            }
        }
    }
}

// ─── Loading Shimmer ──────────────────────────────────────────────────────────

@Composable
fun ShimmerBox(modifier: Modifier = Modifier) {
    val transition = rememberInfiniteTransition(label = "shimmer")
    val alpha by transition.animateFloat(
        initialValue   = 0.3f,
        targetValue    = 0.8f,
        animationSpec  = infiniteRepeatable(tween(900), RepeatMode.Reverse),
        label          = "shimmer_alpha"
    )
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(SurfaceMed.copy(alpha = alpha))
    )
}
