package com.testquack.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.testquack.beans.Filter;
import com.testquack.beans.Small;
import com.testquack.beans.Medium;
import com.testquack.beans.Large;
import com.testquack.beans.TestcaseSizes;
import com.testquack.dal.OrganizationRepository;
import com.testquack.services.errors.EntityAccessDeniedException;
import com.testquack.services.errors.EntityValidationException;
import com.testquack.services.errors.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.testquack.dal.CommonRepository;
import com.testquack.dal.TestcaseSizesRepository;
import ru.greatbit.utils.string.StringUtils;
import ru.greatbit.whoru.auth.Session;

import java.security.NoSuchAlgorithmException;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static java.lang.String.format;
import static org.apache.commons.lang3.StringUtils.isEmpty;

@Service
public class TestcaseSizesService extends BaseService<TestcaseSizes> {

    @Autowired
    private TestcaseSizesRepository repository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Override
    protected CommonRepository<TestcaseSizes> getRepository() {
        return repository;
    }

    @Override
    protected boolean userCanRead(Session session, String projectId, TestcaseSizes entity) {
        return true;
    }

    @Override
    protected boolean userCanSave(Session session, String projectId, TestcaseSizes entity) {
        return false;
    }

    protected boolean userCanSave(Session session, String login) {

        return false;
    }

    @Override
    protected boolean userCanSave(Session session, String projectId, Collection<TestcaseSizes> entities) {
        return false;
    }

    @Override
    protected boolean userCanDelete(Session session, String projectId, String id) {
        return userCanSave(session, id);
    }

    @Override
    protected boolean userCanCreate(Session session, String projectId, TestcaseSizes entity) {

        return false;
    }

    @Override
    protected boolean userCanUpdate(Session session, String projectId, TestcaseSizes entity) {
        return false;
    }

    @Override
    public List<TestcaseSizes> findFiltered(Session session, String projectId, Filter filter) {
System.out.println("TestcaseSizes.findFiltered - session: " + session);
System.out.println("TestcaseSizes.findFiltered - projectId: " + projectId);
System.out.println("TestcaseSizes.findFiltered - filter: " + filter);
System.out.flush();
        return getRepository().find(getCurrOrganizationId(session), projectId, filter);
    }


    public List<TestcaseSizes> findAll() {

System.out.println("TestcaseSizesService::findAll");
System.out.flush();

        List<TestcaseSizes> tcSizesList = StreamSupport.stream(repository.findAll().spliterator(), false).collect(Collectors.toList());
        for (TestcaseSizes tcSize : tcSizesList) {
           System.out.println("TestcaseSizesService.findAll() - tcSize: " + tcSize);
           System.out.flush();
        }


        return tcSizesList;
        //return StreamSupport.stream(repository.findAll().spliterator(), false).collect(Collectors.toList());
    }



}
