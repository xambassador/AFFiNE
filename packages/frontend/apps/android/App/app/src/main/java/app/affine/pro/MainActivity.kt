package app.affine.pro

import android.content.res.ColorStateList
import android.os.Bundle
import android.view.Gravity
import android.view.View
import androidx.coordinatorlayout.widget.CoordinatorLayout
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updateMargins
import androidx.lifecycle.lifecycleScope
import app.affine.pro.ai.AIActivity
import app.affine.pro.plugin.AIButtonPlugin
import app.affine.pro.plugin.AffineThemePlugin
import app.affine.pro.plugin.AuthPlugin
import app.affine.pro.plugin.HashCashPlugin
import app.affine.pro.plugin.NbStorePlugin
import app.affine.pro.service.GraphQLService
import app.affine.pro.service.SSEService
import app.affine.pro.service.WebService
import app.affine.pro.utils.dp
import com.getcapacitor.BridgeActivity
import com.google.android.material.floatingactionbutton.FloatingActionButton
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject


@AndroidEntryPoint
class MainActivity : BridgeActivity(), AIButtonPlugin.Callback, AffineThemePlugin.Callback,
    View.OnClickListener {

    @Inject
    lateinit var webService: WebService

    @Inject
    lateinit var sseService: SSEService

    @Inject
    lateinit var graphQLService: GraphQLService

    init {
        registerPlugins(
            listOf(
                AffineThemePlugin::class.java,
                AIButtonPlugin::class.java,
                AuthPlugin::class.java,
                HashCashPlugin::class.java,
                NbStorePlugin::class.java,
            )
        )
    }

    private val fab: FloatingActionButton by lazy {
        FloatingActionButton(this).apply {
            visibility = View.GONE
            layoutParams = CoordinatorLayout.LayoutParams(dp(52), dp(52)).apply {
                gravity = Gravity.END or Gravity.BOTTOM
                updateMargins(0, 0, dp(24), dp(86))
            }
            customSize = dp(52)
            setImageResource(R.drawable.ic_ai)
            setOnClickListener(this@MainActivity)
            val parent = bridge.webView.parent as CoordinatorLayout
            parent.addView(this)
        }
    }

    private var naviHeight = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ViewCompat.setOnApplyWindowInsetsListener(window.decorView) { v, insets ->
            naviHeight = insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom
            ViewCompat.onApplyWindowInsets(v, insets)
        }
    }

    override fun load() {
        super.load()
        AuthInitializer.initialize(bridge)
    }

    override fun present() {
        lifecycleScope.launch {
            fab.show()
        }
    }

    override fun dismiss() {
        lifecycleScope.launch {
            fab.hide()
        }
    }

    override fun onThemeChanged(darkMode: Boolean) {
        lifecycleScope.launch {
            fab.backgroundTintList = ColorStateList.valueOf(
                ContextCompat.getColor(
                    this@MainActivity,
                    if (darkMode) {
                        R.color.layer_background_primary_dark
                    } else {
                        R.color.layer_background_primary
                    }
                )
            )
        }
    }

    override fun getSystemNaviBarHeight(): Int {
        return naviHeight
    }

    override fun onClick(v: View) {
        lifecycleScope.launch {
            webService.update(bridge)
            sseService.updateServer(bridge)
            graphQLService.updateServer(bridge)
            AIActivity.open(this@MainActivity)
        }
    }

}
