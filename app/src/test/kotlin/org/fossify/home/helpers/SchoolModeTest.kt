// Unit tests for the pure school-mode rules (category + auto window). No Android — plain JVM.

package org.fossify.home.helpers

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SchoolModeTest {

    private val monFri = setOf(2, 3, 4, 5, 6) // Calendar.DAY_OF_WEEK Mon..Fri
    private val nineAm = 9 * 60
    private val start = 8 * 60
    private val end = 14 * 60

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

    @Test
    fun windowOpenOnSchoolDayWithinHours() {
        assertTrue(SchoolMode.isWithinWindow(true, 4, nineAm, monFri, start, end)) // Wed 09:00
    }

    @Test
    fun windowClosedOutsideHoursOrDaysOrWhenDisabled() {
        assertFalse("before start", SchoolMode.isWithinWindow(true, 4, 7 * 60, monFri, start, end))
        assertFalse("at/after end", SchoolMode.isWithinWindow(true, 4, end, monFri, start, end))
        assertFalse("weekend", SchoolMode.isWithinWindow(true, 1, nineAm, monFri, start, end)) // Sun
        assertFalse("disabled", SchoolMode.isWithinWindow(false, 4, nineAm, monFri, start, end))
        assertFalse("empty/invalid window", SchoolMode.isWithinWindow(true, 4, nineAm, monFri, end, start))
    }
}
