// Unit tests for the pure update-feed parsing + version comparison. Plain JVM (org.json).

package org.fossify.home.helpers

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class UpdateCheckerTest {

    @Test
    fun extractsVersionCodeFromAssetName() {
        assertEquals(17, UpdateChecker.versionCodeFromAssetName("launcher-17-foss-release.apk"))
        assertEquals(16, UpdateChecker.versionCodeFromAssetName("launcher-16.apk"))
        assertNull(UpdateChecker.versionCodeFromAssetName("app-release.apk"))
    }

    @Test
    fun extractsVersionCodeFromNotes() {
        assertEquals(21, UpdateChecker.versionCodeFromNotes("Neue Features\nversionCode: 21\nmore"))
        assertEquals(21, UpdateChecker.versionCodeFromNotes("versionCode 21"))
        assertNull(UpdateChecker.versionCodeFromNotes("no code here"))
    }

    @Test
    fun isNewerComparesCodes() {
        assertTrue(UpdateChecker.isNewer(16, 17))
        assertFalse(UpdateChecker.isNewer(17, 17))
        assertFalse(UpdateChecker.isNewer(18, 17))
    }

    @Test
    fun parsesGithubLatestRelease() {
        val json = """
            {
              "tag_name": "v1.11.0",
              "name": "1.11.0",
              "body": "Bugfixes and Papa-Modus",
              "assets": [
                {"name": "launcher-17-foss-release.apk",
                 "browser_download_url": "https://example.test/launcher-17.apk"},
                {"name": "launcher-17.aab",
                 "browser_download_url": "https://example.test/x.aab"}
              ]
            }
        """.trimIndent()
        val r = UpdateChecker.parseLatestRelease(json)!!
        assertEquals(17, r.versionCode)
        assertEquals("1.11.0", r.versionName)
        assertEquals("https://example.test/launcher-17.apk", r.apkUrl)
        assertTrue(r.installable)
    }

    @Test
    fun picksHighestApkCodeAndIgnoresNonApk() {
        val json = """
            {
              "name": "rolling",
              "body": "",
              "assets": [
                {"name": "launcher-16.apk", "browser_download_url": "https://x/16.apk"},
                {"name": "launcher-18.apk", "browser_download_url": "https://x/18.apk"},
                {"name": "notes.txt", "browser_download_url": "https://x/notes.txt"}
              ]
            }
        """.trimIndent()
        val r = UpdateChecker.parseLatestRelease(json)!!
        assertEquals(18, r.versionCode)
        assertEquals("https://x/18.apk", r.apkUrl)
    }

    @Test
    fun releaseWithoutApkIsNotInstallable() {
        val json = """{"name":"x","body":"","assets":[]}"""
        val r = UpdateChecker.parseLatestRelease(json)!!
        assertEquals(0, r.versionCode)
        assertFalse(r.installable)
    }

    @Test
    fun invalidJsonReturnsNull() {
        assertNull(UpdateChecker.parseLatestRelease("not json"))
    }
}
