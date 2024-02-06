package com.testquack.dal.impl;

import com.testquack.beans.DefaultProjectAttributes;
import com.testquack.dal.DefaultProjectAttributesRepositoryCustom;

import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import static org.apache.commons.lang3.StringUtils.isEmpty;

import java.util.List;

public class DefaultProjectAttributesRepositoryCustomImpl extends CommonRepositoryImpl<DefaultProjectAttributes>
        implements DefaultProjectAttributesRepositoryCustom {

    @Override
    public Class getEntityClass() {
        return DefaultProjectAttributes.class;
    }

    @Override
    protected String getCollectionName(String organizationId, String projectId) {
        return isEmpty(organizationId) ? "DefaultProjectAttributes" : organizationId + "_rolecapability";
    }

    @Override
    public List<DefaultProjectAttributes> suggestDefaultProjectAttributes(String organizationId, String literal) {
        Criteria criteria = new Criteria();
        criteria.orOperator(
                Criteria.where("role").regex(literal, "i"),
                Criteria.where("capability").regex(literal, "i")
        );
        Query query = new Query(criteria);
        query.limit(20);
        return mongoOperations.find(query, DefaultProjectAttributes.class, getCollectionName(organizationId, null));
    }

}
