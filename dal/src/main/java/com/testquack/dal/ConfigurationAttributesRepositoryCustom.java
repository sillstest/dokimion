package com.testquack.dal;

import com.testquack.beans.ConfigurationAttributes;

import java.util.List;

public interface ConfigurationAttributesRepositoryCustom {

    public List<ConfigurationAttributes> suggestConfigurationAttributes(String organizationId, String literal);

}
