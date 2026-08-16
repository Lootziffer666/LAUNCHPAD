package org.fossify.home.fragments

import org.junit.Assert.assertEquals
import org.junit.Test

class RulesFragmentTest {
    @Test
    fun energyStatusUsesTheMostImportantLiveState() {
        assertEquals("PAPA-MODUS AKTIV", overviewEnergyStatus(0, 120, true, false, true))
        assertEquals("BEREIT ZUM EINRICHTEN", overviewEnergyStatus(120, 120, false, false, false))
        assertEquals("VERSCHNAUFPAUSE", overviewEnergyStatus(90, 120, true, true, false))
        assertEquals("ENERGIE LEER", overviewEnergyStatus(0, 120, false, true, false))
        assertEquals("ENERGIE KNAPP", overviewEnergyStatus(30, 120, false, true, false))
        assertEquals("ENERGIE VOLL", overviewEnergyStatus(31, 120, false, true, false))
    }

    @Test
    fun countLabelsStayReadableForEmptySingularAndPluralStates() {
        assertEquals(
            "Keine offenen Anfragen",
            countLabel(0, "offene Anfrage", "offene Anfragen", "Keine offenen Anfragen"),
        )
        assertEquals(
            "1 offene Anfrage",
            countLabel(1, "offene Anfrage", "offene Anfragen", "Keine offenen Anfragen"),
        )
        assertEquals(
            "3 offene Anfragen",
            countLabel(3, "offene Anfrage", "offene Anfragen", "Keine offenen Anfragen"),
        )
    }
}
