import TextEditor from '../TextEditor';
import { cx } from '../ui';
import { accountShortcuts } from '../../data/shortcodes';

/**
 * Introduction and Terms steps: a title and a rich-text description.
 * Props: section ('introduction' | 'terms') · heading · intro · titleLabel · descriptionLabel · formData · updateFormData · stepErrors
 */
export default function TextStep({ section, heading, intro, titleLabel, descriptionLabel, titlePlaceholder, descriptionPlaceholder, formData, updateFormData, stepErrors = {} }) {
  const data = formData[section];
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">{heading}</h2>
        <p className="text-muted">{intro}</p>
      </div>
      <section className="flex flex-col gap-5 rounded-lg border border-line p-5">
        <label className="field-label">
          <span>{titleLabel} <span className="text-danger-700">*</span></span>
          <input className={cx('input', stepErrors.title && 'border-danger-700')} value={data.title} placeholder={titlePlaceholder}
            onChange={(e) => updateFormData(section, { title: e.target.value })} />
          {stepErrors.title && <span className="text-sm font-normal text-danger-700">{stepErrors.title}</span>}
        </label>
        <div>
          <span className="mb-1.5 block text-sm font-semibold">{descriptionLabel} <span className="text-danger-700">*</span></span>
          <div className={cx('rounded-md', stepErrors.description && 'ring-2 ring-danger-700')}>
            <TextEditor ariaLabel={descriptionLabel} value={data.description} onChange={(html) => updateFormData(section, { description: html })}
              shortcuts={accountShortcuts} placeholder={descriptionPlaceholder} minHeight={220} />
          </div>
          {stepErrors.description && <p className="mt-1 text-sm text-danger-700">{stepErrors.description}</p>}
        </div>
      </section>
    </div>
  );
}