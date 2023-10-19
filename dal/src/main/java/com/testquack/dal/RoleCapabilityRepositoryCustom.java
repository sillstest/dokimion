package com.testquack.dal;

import com.testquack.beans.RoleCapability;

import java.util.List;

public interface RoleCapabilityRepositoryCustom {

    public List<RoleCapability> suggestRoleCapability(String organizationId, String literal);

}
