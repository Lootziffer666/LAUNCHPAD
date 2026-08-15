package org.fossify.home.helpers

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities

enum class ConnectivityState { AVAILABLE, LOST, RESTORED }

/** Lifecycle-controlled validated-internet observer; Wi-Fi association alone is not enough. */
class ConnectivityStateMonitor(
    context: Context,
    private val onState: (ConnectivityState) -> Unit,
) {
    private val manager = context.getSystemService(ConnectivityManager::class.java)
    private var started = false
    private var wasAvailable: Boolean? = null
    private val callback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) = update(hasInternet(network))
        override fun onCapabilitiesChanged(network: Network, capabilities: NetworkCapabilities) {
            update(capabilities.isValidatedInternet())
        }
        override fun onLost(network: Network) = update(
            manager.allNetworks.any { candidate -> candidate != network && hasInternet(candidate) }
        )
    }

    fun start() {
        if (started) return
        started = true
        wasAvailable = currentInternetAvailable()
        onState(if (wasAvailable == true) ConnectivityState.AVAILABLE else ConnectivityState.LOST)
        manager.registerDefaultNetworkCallback(callback)
    }

    fun stop() {
        if (!started) return
        started = false
        manager.unregisterNetworkCallback(callback)
    }

    private fun update(available: Boolean) {
        val previous = wasAvailable
        if (previous == available) return
        wasAvailable = available
        onState(
            when {
                available && previous == false -> ConnectivityState.RESTORED
                available -> ConnectivityState.AVAILABLE
                else -> ConnectivityState.LOST
            }
        )
    }

    private fun currentInternetAvailable(): Boolean = manager.activeNetwork?.let(::hasInternet) == true
    private fun hasInternet(network: Network): Boolean =
        manager.getNetworkCapabilities(network)?.isValidatedInternet() == true

    private fun NetworkCapabilities.isValidatedInternet() =
        hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
            hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
}
