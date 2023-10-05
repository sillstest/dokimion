package com.testquack.dal;

import org.springframework.data.repository.PagingAndSortingRepository;
import com.testquack.beans.RoleCapability;

public interface RoleCapabilityRepository extends RoleCapabilityRepositoryCustom,
        PagingAndSortingRepository<RoleCapability, String>, CommonRepository<RoleCapability> {
}
