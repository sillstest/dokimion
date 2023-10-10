package com.testquack.dal.impl;

import com.testquack.beans.RoleCapability;
import com.testquack.dal.RoleCapabilityRepositoryCustom;

import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoOperations;

import java.util.List;

public class RoleCapabilityRepositoryCustomImpl extends CommonRepositoryImpl<RoleCapability>
        implements RoleCapabilityRepositoryCustom {

    @Autowired
    MongoOperations mongoOperations;

    @Override
    public List<RoleCapability> findByOrganizationId(String id) {
        Query query = new Query().with(Sort.by(Sort.Direction.ASC, "id"));
        query.addCriteria(Criteria.where("organizationId").in(id));
        return mongoOperations.find(query, RoleCapability.class);
    }

    @Override
    public Class getEntityClass() {
        return RoleCapability.class;
    }

}
