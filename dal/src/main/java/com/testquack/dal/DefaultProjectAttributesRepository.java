package com.testquack.dal;

import org.springframework.data.repository.PagingAndSortingRepository;
import com.testquack.beans.DefaultProjectAttributes;

public interface DefaultProjectAttributesRepository extends DefaultProjectAttributesRepositoryCustom,
        PagingAndSortingRepository<DefaultProjectAttributes, String>, CommonRepository<DefaultProjectAttributes> {
}
