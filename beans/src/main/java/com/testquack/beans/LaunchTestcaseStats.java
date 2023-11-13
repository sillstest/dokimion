package com.testquack.beans;

public class LaunchTestcaseStats extends LaunchStats {

    private String name;
    private String id;
    private boolean broken;
    private boolean launchBroken;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public boolean isBroken() {
        return broken;
    }

    public void setBroken(boolean broken) {
        this.broken = broken;
    }

    public boolean isLaunchBroken() {
        return launchBroken;
    }

    public void setLaunchBroken(boolean launchBroken) {
        this.launchBroken = launchBroken;
    }
}
