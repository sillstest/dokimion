package com.testquack.dal;

import com.testquack.beans.DefaultProjectAttributes;

import java.util.List;

public interface DefaultProjectAttributesRepositoryCustom {

    public List<DefaultProjectAttributes> suggestDefaultProjectAttributes(String organizationId, String literal);

}
