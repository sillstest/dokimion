package com.testquack.dal;

import org.springframework.data.repository.PagingAndSortingRepository;
import com.testquack.beans.ConfigurationAttributes;

public interface ConfigurationAttributesRepository extends ConfigurationAttributesRepositoryCustom,
        PagingAndSortingRepository<ConfigurationAttributes, String>, CommonRepository<ConfigurationAttributes> {
}
