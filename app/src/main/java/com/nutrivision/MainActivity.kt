package com.nutrivision

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.*
import androidx.navigation.compose.*
import com.nutrivision.data.Screen
import com.nutrivision.ui.screens.*
import com.nutrivision.ui.theme.*
import com.nutrivision.viewmodel.AuthViewModel
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            NutriVisionTheme {
                NutriVisionApp()
            }
        }
    }
}

@Composable
fun NutriVisionApp() {
    val navController = rememberNavController()
    val authViewModel: AuthViewModel = hiltViewModel()
    val authState by authViewModel.uiState.collectAsState()

    // Determine start destination based on auth state
    val startDest = if (authState.isLoggedIn) Screen.Home.route else Screen.Login.route

    val bottomBarScreens = listOf(Screen.Home.route, Screen.History.route, Screen.Profile.route)
    val currentBackStack by navController.currentBackStackEntryAsState()
    val currentRoute = currentBackStack?.destination?.route
    val showBottomBar = currentRoute in bottomBarScreens

    Scaffold(
        containerColor = DarkBg,
        bottomBar = {
            if (showBottomBar) {
                BottomNavBar(navController = navController, currentRoute = currentRoute)
            }
        }
    ) { pv ->
        NavHost(
            navController    = navController,
            startDestination = startDest,
            modifier         = Modifier.padding(pv)
        ) {
            composable(Screen.Login.route)     { LoginScreen(navController) }
            composable(Screen.Register.route)  { RegisterScreen(navController) }
            composable(Screen.Onboarding.route) { OnboardingScreen(navController) }
            composable(Screen.Home.route)      { HomeScreen(navController) }
            composable(Screen.History.route)   { HistoryScreen(navController) }
            composable(Screen.Profile.route)   { ProfileScreen(navController) }
            composable(
                route    = Screen.Camera.route,
                arguments = listOf(navArgument("mealType") {
                    type         = NavType.StringType
                    defaultValue = "Lunch"
                })
            ) { backStack ->
                CameraScreen(
                    navController = navController,
                    mealType      = backStack.arguments?.getString("mealType") ?: "Lunch"
                )
            }
            composable(
                route     = Screen.Manual.route + "?mealType={mealType}",
                arguments = listOf(navArgument("mealType") {
                    type         = NavType.StringType
                    defaultValue = "Lunch"
                })
            ) { backStack ->
                ManualEntryScreen(
                    navController = navController,
                    mealType      = backStack.arguments?.getString("mealType") ?: "Lunch"
                )
            }
        }
    }
}

@Composable
private fun BottomNavBar(navController: NavController, currentRoute: String?) {
    NavigationBar(
        containerColor = SurfaceDark,
        tonalElevation = 0.dp
    ) {
        listOf(
            Triple(Screen.Home.route,    Icons.Default.Home,     "Today"),
            Triple(Screen.History.route, Icons.Default.BarChart, "History"),
            Triple(Screen.Profile.route, Icons.Default.Person,   "Profile")
        ).forEach { (route, icon, label) ->
            NavigationBarItem(
                selected = currentRoute == route,
                onClick  = {
                    navController.navigate(route) {
                        launchSingleTop = true
                        restoreState    = true
                        popUpTo(navController.graph.startDestinationId) { saveState = true }
                    }
                },
                icon     = { Icon(icon, label, modifier = Modifier.size(22.dp)) },
                label    = { Text(label, style = MaterialTheme.typography.labelLarge) },
                colors   = NavigationBarItemDefaults.colors(
                    selectedIconColor    = NeonGreen,
                    selectedTextColor    = NeonGreen,
                    unselectedIconColor  = TextMuted,
                    unselectedTextColor  = TextMuted,
                    indicatorColor       = NeonGreen.copy(alpha = 0.15f)
                )
            )
        }
    }
}
