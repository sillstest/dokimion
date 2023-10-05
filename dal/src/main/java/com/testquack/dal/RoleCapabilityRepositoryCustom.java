package com.testquack.dal;

import com.testquack.beans.RoleCapability;

import java.util.List;

public interface RoleCapabilityRepositoryCustom {

    List<RoleCapability> findByOrganizationId(String id);
}
