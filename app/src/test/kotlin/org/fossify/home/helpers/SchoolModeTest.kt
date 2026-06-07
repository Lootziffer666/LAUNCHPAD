// Unit tests for the pure school-mode category rule. No Android — runs on the plain JVM.

package org.fossify.home.helpers

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SchoolModeTest {

    @Test
    fun pausesOnlyLeisureWhenActive() {
        assertTrue(SchoolMode.blocksCategory(true, LaunchpadConstants.CATEGORY_ACTIVE_LEISURE))
        assertFalse(SchoolMode.blocksCategory(true, LaunchpadConstants.CATEGORY_LEARNING))
        assertFalse(SchoolMode.blocksCategory(true, LaunchpadConstants.CATEGORY_COMMUNICATION))
        assertFalse(SchoolMode.blocksCategory(true, LaunchpadConstants.CATEGORY_COOLDOWN))
        assertFalse(SchoolMode.blocksCategory(true, null))
    }

    @Test
    fun blocksNothingWhenInactive() {
        assertFalse(SchoolMode.blocksCategory(false, LaunchpadConstants.CATEGORY_ACTIVE_LEISURE))
    }
}
