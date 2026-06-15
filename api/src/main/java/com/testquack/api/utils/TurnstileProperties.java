package com.testquack.api.utils;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;

public class TurnstileProperties {
    private static final Properties props = new Properties();

    static {
        String path = System.getProperty("secrets.path", "/etc/dokimion/cloudflareTurnstile.properties");
        try (FileInputStream fis = new FileInputStream(path)) {
            props.load(fis);
        } catch (IOException e) {
            throw new RuntimeException("Failed to load secrets from: " + path, e);
        }
    }

    public static String get(String key) {
        return props.getProperty(key);
    }
}
